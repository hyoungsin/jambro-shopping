import { Product } from '../models/Product.js';

// 모든 상품 목록 조회 (페이지네이션: 한 번에 2개씩)
export async function listProducts(req, res, next) {
  try {
    // 쿼리 파라미터에서 page 추출 (기본값: 1)
    const page = parseInt(req.query.page) || 1;
    const limit = 2; // 한 번에 2개씩만 반환
    const skip = (page - 1) * limit; // 건너뛸 개수 계산

    // 전체 상품 개수 조회
    const total = await Product.countDocuments();

    // 페이지네이션 적용하여 상품 조회
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // 전체 페이지 수 계산
    const totalPages = Math.ceil(total / limit);

    // 응답 데이터
    res.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (err) {
    next(err);
  }
}

// 특정 상품 조회 (ID로)
export async function getProduct(req, res, next) {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
}

// 새 상품 생성
export async function createProduct(req, res, next) {
  try {
    // 관리자 권한 확인
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ 
        message: '관리자만 상품을 등록할 수 있습니다.' 
      });
    }

    const { sku, name, price, category, generation, image, description } = req.body;

    // 필수 필드 검증
    if (!sku || !name || !price || !category || !generation || !image) {
      return res.status(400).json({ 
        message: 'SKU, 상품이름, 가격, 카테고리, 세대, 이미지는 필수입니다.' 
      });
    }

    // 가격 유효성 검증
    if (typeof price !== 'number' || price < 0) {
      return res.status(400).json({ 
        message: '가격은 0 이상의 숫자여야 합니다.' 
      });
    }

    const product = await Product.create({
      sku: sku.toUpperCase().trim(),
      name: name.trim(),
      price,
      category: category.trim(),
      generation: generation.trim(),
      image: image.trim(),
      description: description ? description.trim() : undefined
    });

    res.status(201).json(product);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ 
        message: '이미 존재하는 SKU입니다. 다른 SKU를 사용해주세요.' 
      });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        message: Object.values(err.errors).map(e => e.message).join(', ') 
      });
    }
    next(err);
  }
}

// 상품 정보 수정
export async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const { sku, name, price, category, generation, image, description } = req.body;

    const updateData = {};
    if (sku) updateData.sku = sku.toUpperCase().trim();
    if (name) updateData.name = name.trim();
    if (price !== undefined) {
      if (typeof price !== 'number' || price < 0) {
        return res.status(400).json({ 
          message: '가격은 0 이상의 숫자여야 합니다.' 
        });
      }
      updateData.price = price;
    }
    if (category) updateData.category = category.trim();
    if (generation) updateData.generation = generation.trim();
    if (image) updateData.image = image.trim();
    if (description !== undefined) {
      updateData.description = description ? description.trim() : undefined;
    }

    const product = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    }

    res.json(product);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ 
        message: '이미 존재하는 SKU입니다. 다른 SKU를 사용해주세요.' 
      });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        message: Object.values(err.errors).map(e => e.message).join(', ') 
      });
    }
    next(err);
  }
}

// 상품 삭제
export async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

