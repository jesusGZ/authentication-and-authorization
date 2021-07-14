const User = require("../models/user.model");
const {
  PHONE_NOT_FOUND_ERR,
  PHONE_ALREADY_EXISTS_ERR,
  USER_NOT_FOUND_ERR,
  INCORRECT_OTP_ERR,
  ACCESS_DENIED_ERR,
} = require("../errors");
const { checkPassword, hashPassword } = require("../utils/password.util");
const { createJwtToken } = require("../utils/token.util");
const { generateOTP, fast2sms } = require("../utils/otp.util");

// Crear nuevo usuario

exports.createNewUser = async (req, res, next) => {
  try {
    let { phone, name } = req.body;

    // verificar numeros duplicados
    const phoneExist = await User.findOne({ phone });

    if (phoneExist) {
      next({ status: 400, message: PHONE_ALREADY_EXISTS_ERR });
      return;
    }


    // Crear nuevo usuario
    const createUser = new User({
      phone,
      name,
      role : phone === process.env.ADMIN_PHONE ? "ADMIN" :"USER"
    });

    // Guardar usuario
    const user = await createUser.save();

    res.status(200).json({
      type: "success",
      message: "Cuenta creada OTP enviar a número de móvil",
      data: {
        userId: user._id,
      },
    });

    // generar otp
    const otp = generateOTP(6);
    // guardar otp en la coleccion
    user.phoneOtp = otp;
    await user.save();
    // enviar el otp
    await fast2sms(
      {
        message: `Your OTP is ${otp}`,
        contactNumber: user.phone,
      },
      next
    );
  } catch (error) {
    next(error);
  }
};



// Login por otp 

exports.loginWithPhoneOtp = async (req, res, next) => {
  try {

    const { phone } = req.body;
    const user = await User.findOne({ phone });

    if (!user) {
      next({ status: 400, message: PHONE_NOT_FOUND_ERR });
      return;
    }

    res.status(201).json({
      type: "success",
      message: "OTP enviado a su número de teléfono registrado",
      data: {
        userId: user._id,
      },
    });

    // generar otp
    const otp = generateOTP(6);
    // guardar otp en la coleccion
    user.phoneOtp = otp;
    user.isAccountVerified = true;
    await user.save();
    // enviar el otp
    await fast2sms(
      {
        message: `Tu OTP es ${otp}`,
        contactNumber: user.phone,
      },
      next
    );
  } catch (error) {
    next(error);
  }
};

// ---------------------- verificar otp -------------------------

exports.verifyPhoneOtp = async (req, res, next) => {
  try {
    const { otp, userId } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      next({ status: 400, message: USER_NOT_FOUND_ERR });
      return;
    }

    if (user.phoneOtp !== otp) {
      next({ status: 400, message: INCORRECT_OTP_ERR });
      return;
    }
    const token = createJwtToken({ userId: user._id });

    user.phoneOtp = "";
    await user.save();

    res.status(201).json({
      type: "success",
      message: "OTP verificado con éxito",
      data: {
        token,
        userId: user._id,
      },
    });
  } catch (error) {
    next(error);
  }
};


// buscar usuario actual

exports.fetchCurrentUser = async (req, res, next) => {
  try {
    const currentUser = res.locals.user;


    return res.status(200).json({
      type: "success",
      message: "buscar usuario actual",
      data: {
        user:currentUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Acceso para administrador

exports.handleAdmin = async (req, res, next) => {
  try {
    const currentUser = res.locals.user;

    return res.status(200).json({
      type: "success",
      message: "eres administrador !!",
      data: {
        user:currentUser,
      },
    });
  } catch (error) {
    next(error);
  }
};
