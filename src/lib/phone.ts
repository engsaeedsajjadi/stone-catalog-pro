export function normalizeDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (c) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c)))
    .replace(/[٠-٩]/g, (c) => String("٠١٢٣٤٥٦٧٨٩".indexOf(c)));
}
export function normalizePhone(value: string) {
  let phone = normalizeDigits(value).replace(/[\s()-]/g, "");
  if (phone.startsWith("0098")) phone = `0${phone.slice(4)}`;
  else if (phone.startsWith("+98")) phone = `0${phone.slice(3)}`;
  else if (/^98\d{10}$/.test(phone)) phone = `0${phone.slice(2)}`;
  return phone;
}
