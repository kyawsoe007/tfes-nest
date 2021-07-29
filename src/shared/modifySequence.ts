const modifySequenceNumber = (
  sequencevalue: string,
  initialCountNum: number,
  replacementChar: string,
  toIncrement: boolean,
  prefix: string,
) => {
  const newCountNum = initialCountNum ? initialCountNum + 1 : 1;
  const newSequenceNum = toIncrement
    ? `${sequencevalue}-${newCountNum}`
    : `${sequencevalue}`;

  const newSequenceValue = newSequenceNum.replace(prefix, replacementChar);

  const ciplNum = `CI${newSequenceValue.replace(replacementChar, '')}`;
  const PlNum = `PI${newSequenceValue.replace(replacementChar, '')}`;

  return { newSequenceValue, newCountNum, ciplNum, PlNum };
};

export default modifySequenceNumber;
