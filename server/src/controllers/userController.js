import { User } from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// 모든 유저 목록 조회
export async function listUsers(req, res, next) {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
}

// 특정 유저 조회
export async function getUser(req, res, next) {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
}

// 새 유저 생성
export async function createUser(req, res, next) {
  try {
    const { email, name, password, userType, address } = req.body;
    
    // 비밀번호 암호화
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const user = await User.create({
      email,
      name,
      password: hashedPassword,
      userType: userType || 'customer',
      address
    });
    // 비밀번호는 응답에서 제외
    const userResponse = user.toObject();
    delete userResponse.password;
    res.status(201).json(userResponse);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    next(err);
  }
}

// 유저 정보 수정
export async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { email, name, password, userType, address } = req.body;
    
    const updateData = {};
    if (email) updateData.email = email;
    if (name) updateData.name = name;
    if (password) {
      // 비밀번호 암호화
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }
    if (userType) updateData.userType = userType;
    if (address !== undefined) updateData.address = address;
    
    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    next(err);
  }
}

// 유저 삭제
export async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// 로그인
export async function loginUser(req, res, next) {
  try {
    const { email, password } = req.body;

    // 이메일과 비밀번호가 모두 제공되었는지 확인
    if (!email || !password) {
      return res.status(400).json({ message: '이메일과 비밀번호를 입력해주세요.' });
    }

    // 이메일로 유저 찾기
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    // JWT 토큰 생성
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        userType: user.userType 
      },
      JWT_SECRET,
      { expiresIn: '7d' } // 7일 후 만료
    );

    // 응답 데이터 (비밀번호 제외)
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      message: '로그인 성공',
      token,
      user: userResponse
    });
  } catch (err) {
    next(err);
  }
}

// 토큰으로 현재 사용자 정보 가져오기
export async function getCurrentUser(req, res, next) {
  try {
    // authenticateToken 미들웨어에서 req.user에 사용자 정보가 저장됨
    const userResponse = req.user.toObject();
    delete userResponse.password;
    res.json(userResponse);
  } catch (err) {
    next(err);
  }
}

