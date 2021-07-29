const orderCalculation = (
  discount: number,
  isPercentage: boolean,
  total: number,
  gst: number,
) => {
  discount = discount || 0;
  const discountAmt = isPercentage ? (discount / 100) * total : discount;
  // const discountAmt = discount ? (discount / 100) * total : 0;
  const subTotalAmt = total - discountAmt;

  const gstAmt = (subTotalAmt * gst) / 100;

  return { discountAmt, subTotalAmt, gstAmt };
};

export default orderCalculation;
