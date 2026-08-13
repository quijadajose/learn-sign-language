/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    /* ── Hexagonal layers ─────────────────────────────────────────── */
    {
      name: 'domain-no-outer-layers',
      comment:
        'Domain must stay pure: it cannot depend on application or infrastructure.',
      severity: 'error',
      from: { path: '^src/[^/]+/domain/' },
      to: { path: '^src/[^/]+/(application|infrastructure)/' },
    },
    {
      name: 'application-no-infrastructure',
      comment:
        'Application may depend on domain ports only, never on concrete infrastructure adapters.',
      severity: 'error',
      from: { path: '^src/[^/]+/application/' },
      to: { path: '^src/[^/]+/infrastructure/' },
    },

    /* ── Vertical slicing ─────────────────────────────────────────── */
    {
      name: 'no-cross-slice-infrastructure',
      comment:
        'A feature must not import another feature’s infrastructure. ' +
        'Compose via Nest modules + domain ports. ' +
        'Exceptions: same slice, composition roots (*.module.ts), shared kernel, ' +
        'and auth/permissions guards/decorators as cross-cutting platform concerns.',
      severity: 'error',
      from: {
        path: '^src/([^/]+)/',
        pathNot: [
          '^src/[^/]+/[^./]+\\.module\\.ts$',
          '^src/app\\.module\\.ts$',
          '^src/seeder/',
          '^src/db/',
          '^src/config/',
          '^src/main\\.ts$',
          '^src/generate-openapi\\.ts$',
          '^src/instrument\\.ts$',
        ],
      },
      to: {
        path: '^src/([^/]+)/infrastructure/',
        pathNot: [
          '^src/$1/',
          '^src/shared/',
          '^src/auth/infrastructure/(decorators|guards)/',
          '^src/permissions/infrastructure/(decorators|guards)/',
        ],
      },
    },
    {
      name: 'shared-no-feature-internals',
      comment:
        'Shared kernel must not depend on feature application/domain code. ' +
        'Auth/permissions guards/decorators are allowed as platform cross-cutting.',
      severity: 'error',
      from: { path: '^src/shared/' },
      to: {
        path: '^src/(?!shared/)([^/]+)/(application|domain)/',
      },
    },

    /* ── Hygiene ──────────────────────────────────────────────────── */
    {
      name: 'no-orphans',
      comment:
        'Unused module — wire it up or remove it. Migrations/config/dotfiles are excluded.',
      severity: 'warn',
      from: {
        orphan: true,
        pathNot: [
          '(^|/)[.][^/]+[.](?:js|cjs|mjs|ts|cts|mts|json)$',
          '[.]d[.]ts$',
          '(^|/)tsconfig[.]json$',
          '(^|/)(?:babel|webpack)[.]config[.](?:js|cjs|mjs|ts|cts|mts|json)$',
          '^src/db/migrations/',
          '^src/config/',
          '^src/types/',
          '^src/main\\.ts$',
          '^src/generate-openapi\\.ts$',
          '^src/instrument\\.ts$',
          '^src/app\\.module\\.ts$',
          '\\.module\\.ts$',
          '(^|/)__mocks__/',
          '[.]mock[.](?:js|cjs|mjs|ts)$',
        ],
      },
      to: {},
    },
    {
      name: 'no-deprecated-core',
      comment:
        'Depends on a deprecated Node core module — find an alternative.',
      severity: 'warn',
      from: {},
      to: {
        dependencyTypes: ['core'],
        path: [
          '^v8/tools/codemap$',
          '^v8/tools/consarray$',
          '^v8/tools/csvparser$',
          '^v8/tools/logreader$',
          '^v8/tools/profile_view$',
          '^v8/tools/profile$',
          '^v8/tools/SourceMap$',
          '^v8/tools/splaytree$',
          '^v8/tools/tickprocessor-driver$',
          '^v8/tools/tickprocessor$',
          '^node-inspect/lib/_inspect$',
          '^node-inspect/lib/internal/inspect_client$',
          '^node-inspect/lib/internal/inspect_repl$',
          '^async_hooks$',
          '^punycode$',
          '^domain$',
          '^constants$',
          '^sys$',
          '^_linklist$',
          '^_stream_wrap$',
        ],
      },
    },
    {
      name: 'not-to-deprecated',
      comment:
        'Depends on a deprecated npm package — upgrade or replace it.',
      severity: 'warn',
      from: {},
      to: { dependencyTypes: ['deprecated'] },
    },
    {
      name: 'no-non-package-json',
      severity: 'error',
      comment:
        'Depends on an npm package that is not listed in package.json dependencies.',
      from: {},
      to: { dependencyTypes: ['npm-no-pkg', 'npm-unknown'] },
    },
    {
      name: 'not-to-unresolvable',
      comment: 'Depends on a module that cannot be resolved on disk.',
      severity: 'error',
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: 'no-duplicate-dep-types',
      comment:
        'Package appears in both dependencies and devDependencies.',
      severity: 'warn',
      from: {},
      to: {
        moreThanOneDependencyType: true,
        dependencyTypesNot: ['type-only'],
      },
    },
    {
      name: 'not-to-spec',
      comment: 'Production code must not depend on test/spec files.',
      severity: 'error',
      from: {
        pathNot: '[.](?:spec|test)[.](?:js|mjs|cjs|jsx|ts|mts|cts|tsx)$',
      },
      to: {
        path: '[.](?:spec|test)[.](?:js|mjs|cjs|jsx|ts|mts|cts|tsx)$',
      },
    },
    {
      name: 'optional-deps-used',
      severity: 'info',
      comment: 'Uses an optionalDependency — confirm this is intentional.',
      from: {},
      to: { dependencyTypes: ['npm-optional'] },
    },
    {
      name: 'peer-deps-used',
      comment: 'Uses a peerDependency — confirm this is intentional.',
      severity: 'warn',
      from: {},
      to: { dependencyTypes: ['npm-peer'] },
    },
  ],
  options: {
    doNotFollow: {
      path: ['node_modules'],
    },
    exclude: {
      path: 'node_modules|dist|coverage|\\.spec\\.ts$|\\.test\\.ts$',
    },
    includeOnly: '^src/',
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.build.json',
    },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      mainFields: ['main', 'types', 'typings'],
    },
    skipAnalysisNotInRules: true,
    reporterOptions: {
      text: { highlightFocused: true },
      dot: {
        collapsePattern: 'node_modules/(?:@[^/]+/[^/]+|[^/]+)',
      },
      archi: {
        collapsePattern:
          '^(?:packages|src|lib(s?)|app(s?)|bin|test(s?)|spec(s?))/[^/]+|node_modules/(?:@[^/]+/[^/]+|[^/]+)',
      },
    },
  },
};
