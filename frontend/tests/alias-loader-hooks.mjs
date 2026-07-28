export async function resolve(specifier, context, nextResolve) {
  if (!specifier.startsWith("@/")) {
    return nextResolve(specifier, context);
  }

  const sourcePath = specifier.slice(2);
  const sourceUrl = new URL(`../src/${sourcePath}.ts`, import.meta.url);
  return nextResolve(sourceUrl.href, context);
}
