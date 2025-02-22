import express from 'express';
import prisma from '../utils/prismaClinet.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import authMiddleware from '../middlewares/authMiddleware.js';

dotenv.config();

const userRouter = express.Router();

userRouter.post('/signup', async (req, res) => {
  try {
    const { loginId, password, userNamePosition, signUpCode } = req.body;
    const SIGN_UP_CODE = process.env.CMS_SIGN_UP_CODE;
    if (!loginId || !password || !userNamePosition) return res.status(401).json({ message: "정보를 입력해주세요." });

    if (SIGN_UP_CODE !== signUpCode) {
      return res.status(401).json({ message: "CMS_CODE가 잘못되었습니다." });
    }

    const existLoginId = await prisma.users.findFirst({
      where: {
        loginId: loginId,
      }
    })

    if (existLoginId) return res.status(401).json({ message: "이미 존재하는 ID입니다." });

    const encryptionPassword = await bcrypt.hash(password, 10);

    await prisma.users.create({
      data: {
        loginId: loginId,
        password: encryptionPassword,
        userNamePosition: userNamePosition,
      },
      select: {
        userId: true,
        loginId: true,
        userNamePosition: true,
      }
    });

    return res.status(201).json({ message: "회원가입이 완료되었습니다." });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "server error" });
  }
});


userRouter.post('/signin', async (req, res) => {
  try {
    const { loginId, password } = req.body;
    const key = process.env.SECRET_KEY;

    const isExistUser = await prisma.users.findFirst({
      where: {
        loginId: loginId
      }
    });

    if (!isExistUser) return res.status(401).json({ message: "존재하지 않는 유저입니다." });

    const decodedPassword = await bcrypt.compare(password, isExistUser.password);
    if (!decodedPassword) return res.status(403).json({ message: "잘못된 정보입니다." });


    const token = jwt.sign({ userId: isExistUser.userId }, key, { expiresIn: "3h" });

    const userInfo = await prisma.users.findFirst({
      where: {
        loginId: loginId
      },
      select: {
        userId: true,
        userNamePosition: true
      }
    })

    return res.status(201).json({
      userInfo: userInfo,
      token: token,
    })
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "server error" });
  }
})

userRouter.get('/users', async (req, res) => {
  try {
    const findUsers = await prisma.users.findMany({
      select: {
        userId: true,
        userNamePosition: true,
      }
    });

    return res.status(201).json({ users: findUsers });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "server error" });
  }
})

userRouter.get('/user', authMiddleware, async (req, res) => {
  try {
    const userId = req.user;
    const findUser = await prisma.users.findFirst({
      where: { userId: +userId },
      select: {
        userId: true,
        userNamePosition: true,
      }
    })

    if (!findUser) return res.status(401).json({ message: "해당하는 유저가 없습니다." });

    return res.status(201).json({ userInfo: findUser });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "server error" });
  }
})

userRouter.get('/verify/token', authMiddleware, async (req, res) => {
  try {
    return res.status(201).json({ hasToken: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "server error" });
  }
})

export default userRouter;