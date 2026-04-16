function generateUUIDV7(): string {
  const timestamp = BigInt(Date.now());
  const timestampHex = timestamp.toString(16).padStart(12, '0');
  
  const randomBytes = new Uint8Array(10);
  crypto.getRandomValues(randomBytes);
  
  const random = BigInt('0x' + Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join(''));
  
  const timeLow = timestampHex.substring(8, 12);
  const timeMid = timestampHex.substring(4, 8);
  const timeHighAndVersion = '7' + timestampHex.substring(0, 4);
  
  const randomStr = random.toString(16).padStart(20, '0');
  const clockAndReserved = (parseInt(randomStr.substring(0, 1), 16) & 0x3f | 0x80).toString(16) + randomStr.substring(1, 3);
  const node = randomStr.substring(3);
  
  return `${timeLow}-${timeMid}-${timeHighAndVersion}-${clockAndReserved}-${node}`;
}

export { generateUUIDV7 };