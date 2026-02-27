/**
 * Script de teste para API de Reviews
 * 
 * Como usar:
 * 1. Certifique-se de que o servidor está rodando
 * 2. Tenha um token JWT válido de um cliente
 * 3. Tenha um productId válido de um produto
 * 4. Execute: node test-review-api.js
 */

const API_URL = 'http://localhost:5000/api';

// CONFIGURAÇÃO - Substitua com seus valores reais
const TOKEN = 'SEU_TOKEN_JWT_AQUI';
const PRODUCT_ID = 'SEU_PRODUCT_ID_AQUI';

async function testCreateReview() {
  console.log('🧪 Testando criação de review...\n');

  try {
    const response = await fetch(`${API_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify({
        productId: PRODUCT_ID,
        rating: 5,
        title: 'Produto excelente!',
        comment: 'Adorei o produto, superou minhas expectativas. Entrega rápida e produto de qualidade.'
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Review criado com sucesso!');
      console.log('Review ID:', data.review.id);
      console.log('Rating:', data.review.rating);
      console.log('Verificado:', data.review.isVerifiedPurchase ? 'Sim' : 'Não');
      return data.review.id;
    } else {
      console.log('❌ Erro ao criar review:', data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
    return null;
  }
}

async function testGetProductReviews() {
  console.log('\n🧪 Testando busca de reviews do produto...\n');

  try {
    const response = await fetch(`${API_URL}/reviews/product/${PRODUCT_ID}`);
    const data = await response.json();

    if (response.ok) {
      console.log('✅ Reviews encontrados:', data.reviews.length);
      console.log('Total de reviews:', data.pagination.total);
      console.log('Distribuição de ratings:', data.stats.ratingDistribution);
    } else {
      console.log('❌ Erro ao buscar reviews:', data.message);
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

async function testGetMyReviews() {
  console.log('\n🧪 Testando busca de minhas reviews...\n');

  try {
    const response = await fetch(`${API_URL}/reviews/my-reviews`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    });
    const data = await response.json();

    if (response.ok) {
      console.log('✅ Minhas reviews encontradas:', data.reviews.length);
      data.reviews.forEach(review => {
        console.log(`- ${review.product.name}: ${review.rating} estrelas`);
      });
    } else {
      console.log('❌ Erro ao buscar minhas reviews:', data.message);
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Iniciando testes da API de Reviews\n');
  console.log('='.repeat(50));

  if (TOKEN === 'SEU_TOKEN_JWT_AQUI' || PRODUCT_ID === 'SEU_PRODUCT_ID_AQUI') {
    console.log('⚠️  ATENÇÃO: Configure TOKEN e PRODUCT_ID antes de executar!');
    return;
  }

  // Teste 1: Criar review
  const reviewId = await testCreateReview();

  // Teste 2: Buscar reviews do produto
  await testGetProductReviews();

  // Teste 3: Buscar minhas reviews
  await testGetMyReviews();

  console.log('\n' + '='.repeat(50));
  console.log('✅ Testes concluídos!\n');
}

// Executar testes
runTests();
