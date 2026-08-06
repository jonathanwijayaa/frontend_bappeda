export const formatPhoneDisplay = (phone: string | null | undefined): string => {
  if (!phone) return "-";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length >= 10 && cleaned.length <= 13) {
    return cleaned.replace(/(\d{4})(\d{4})(\d{2,5})/, "$1-$2-$3");
  }
  return phone;
};
