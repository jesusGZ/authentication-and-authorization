const fast2sms = require("fast-two-sms");
const {FAST2SMS} = require("../config");

exports.generateOTP = (otp_length) => {
  // Declare una variable de dígitos que almacena todos los dígitos
  var digits = "4451191234";
  let OTP = "";
  for (let i = 0; i < otp_length; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
};

exports.fast2sms = async ({ message, contactNumber }, next) => {
  try {
    const res = await fast2sms.sendMessage({
      authorization: FAST2SMS,
      message,
      numbers: [contactNumber],
    });
    console.log(res);
  } catch (error) {
    next(error);
  }
};