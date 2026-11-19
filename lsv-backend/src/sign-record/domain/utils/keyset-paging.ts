/**
 * BE-11: recorre una consulta por páginas con cursor keyset (id > último id leído),
 * de modo que en memoria solo vive una página a la vez y nunca el conjunto completo.
 */
export async function* pageByKeyset<T extends { id: string }>(
  fetchPage: (afterId: string | undefined, limit: number) => Promise<T[]>,
  pageSize: number,
): AsyncGenerator<T> {
  let afterId: string | undefined;
  for (;;) {
    const page = await fetchPage(afterId, pageSize);
    for (const item of page) {
      yield item;
    }
    if (page.length < pageSize) return;
    afterId = page[page.length - 1].id;
  }
}
