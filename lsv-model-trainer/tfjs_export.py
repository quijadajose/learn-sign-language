"""Structured post-processing of tensorflowjs model.json (no TF dependency)."""

from __future__ import annotations

import hashlib
import json
import os
import shutil
import uuid
from typing import Any


def strip_sequential_weight_prefix(name: str) -> str:
    """Remove Keras Sequential scope prefix (sequential/ or sequential_N/)."""
    if '/' not in name:
        return name
    prefix, rest = name.split('/', 1)
    if prefix == 'sequential' or (
        prefix.startswith('sequential_') and prefix[len('sequential_'):].isdigit()
    ):
        return rest
    return name


def assert_patched_model_json(model_data: dict[str, Any]) -> None:
    if 'modelTopology' not in model_data and 'weightsManifest' not in model_data:
        raise ValueError(
            'TFJS model.json missing modelTopology and weightsManifest after patch'
        )
    for manifest in model_data.get('weightsManifest', []):
        for weight in manifest.get('weights', []):
            name = weight.get('name')
            if not isinstance(name, str):
                continue
            if name.startswith('sequential/') or (
                name.startswith('sequential_') and '/' in name
            ):
                raise ValueError(
                    f'TFJS weight name still has Sequential prefix after patch: {name}'
                )


def patch_model_json(model_json_path: str, input_shape: list) -> None:
    if not os.path.exists(model_json_path):
        # Fallar acá evita devolver un job "exitoso" cuyo modelJsonUrl apunta a
        # un archivo inexistente: el backend marcaría el modelo como READY y el
        # error recién aparecería al cargarlo en el navegador.
        raise FileNotFoundError(
            f'TFJS export did not produce {model_json_path}'
        )

    with open(model_json_path, 'r', encoding='utf-8') as f:
        model_data = json.load(f)

    if not isinstance(model_data, dict):
        raise ValueError(
            f'Expected object in {model_json_path}, got {type(model_data)}'
        )

    if 'weightsManifest' in model_data:
        for manifest in model_data['weightsManifest']:
            if 'weights' in manifest:
                for weight in manifest['weights']:
                    if 'name' in weight and isinstance(weight['name'], str):
                        weight['name'] = strip_sequential_weight_prefix(
                            weight['name']
                        )

    def patch_layers(obj: Any) -> None:
        if not isinstance(obj, dict):
            return
        if 'layers' in obj and isinstance(obj['layers'], list):
            for i, layer in enumerate(obj['layers']):
                if not isinstance(layer, dict) or 'config' not in layer:
                    continue
                if 'dtype' in layer['config'] and isinstance(
                    layer['config']['dtype'], dict
                ):
                    layer['config']['dtype'] = 'float32'
                if i == 0 or layer.get('class_name') == 'InputLayer':
                    shape = (
                        layer['config'].get('batch_input_shape')
                        or layer['config'].get('batchInputShape')
                        or layer['config'].get('batch_shape')
                        or layer['config'].get('shape')
                        or input_shape
                    )
                    layer['config']['batch_input_shape'] = shape
                    layer['config']['batchInputShape'] = shape
        for value in obj.values():
            if isinstance(value, dict):
                patch_layers(value)
            elif isinstance(value, list):
                for item in value:
                    patch_layers(item)

    patch_layers(model_data)
    assert_patched_model_json(model_data)

    # Escritura atómica: un model.json truncado deja el modelo irrecuperable.
    tmp_path = f'{model_json_path}.tmp'
    with open(tmp_path, 'w', encoding='utf-8') as f:
        json.dump(model_data, f)
    os.replace(tmp_path, model_json_path)


def weight_shard_paths(model_json_path: str) -> list[str]:
    """Shards ``.bin`` que declara el ``weightsManifest``, en orden.

    Se leen del manifest en vez de listar la carpeta: listar levantaría shards
    de un export anterior que siguen en disco, y el backend los publicaría.
    Solo se aceptan nombres planos porque el backend los resuelve junto al
    ``model.json``.
    """
    with open(model_json_path, 'r', encoding='utf-8') as f:
        model_data = json.load(f)
    paths: list[str] = []
    for manifest in model_data.get('weightsManifest', []):
        for name in manifest.get('paths', []):
            if (
                not isinstance(name, str)
                or not name
                or name != os.path.basename(name)
                or name in ('.', '..')
            ):
                raise ValueError(f'Invalid weight shard path in model.json: {name!r}')
            if name not in paths:
                paths.append(name)
    if not paths:
        raise RuntimeError(f'TFJS export declared no .bin shards in {model_json_path}')
    return paths


def sha256_file(path: str) -> str:
    digest = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def replace_directory(source: str, target: str) -> None:
    """Pone ``source`` en lugar de ``target`` sin dejar nunca una carpeta mezclada.

    ``os.replace`` no puede pisar un directorio con contenido, así que el viejo
    se aparta primero y se borra solo cuando el nuevo ya está en su lugar. Si
    el segundo rename falla, el viejo vuelve.
    """
    if not os.path.exists(target):
        os.rename(source, target)
        return
    backup = f'{target}.old-{uuid.uuid4().hex}'
    os.rename(target, backup)
    try:
        os.rename(source, target)
    except BaseException:
        os.rename(backup, target)
        raise
    shutil.rmtree(backup, ignore_errors=True)
