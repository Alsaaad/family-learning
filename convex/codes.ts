/* رمز الكتابة علني أصلًا (موجود في sync-config.js). رمز المتابعة مخزّن كبصمة SHA-256 فقط. */
export const WRITE_CODE = "8616fa78e87cdc4617e46ea6"
const PARENT_HASH = "8fc211ec32bbca072e610269ebb70f2e2f65303d5110b1314fd96c88b62c2b22"
export async function isParent(code: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(code || ""))
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("") === PARENT_HASH
}
