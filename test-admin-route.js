// Script de teste para verificar se a rota admin está funcionando
import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api';

async function testAdminRoute() {
  console.log('🧪 Testando rota admin...\n');

  try {
    // 1. Testar health check
    console.log('1️⃣ Testando health check...');
    const healthResponse = await fetch(`${API_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    console.log('');

    // 2. Fazer login
    console.log('2️⃣ Fazendo login como admin...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@techstore.ao',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      console.error('❌ Erro no login:', loginResponse.status);
      const errorData = await loginResponse.json();
      console.error('Detalhes:', errorData);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login bem-sucedido!');
    console.log('Usuário:', loginData.data.user.name);
    console.log('Role:', loginData.data.user.role);
    console.log('');

    const token = loginData.data.token;

    // 3. Testar rota admin
    console.log('3️⃣ Testando rota /admin/dashboard...');
    const dashboardResponse = await fetch(`${API_URL}/admin/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!dashboardResponse.ok) {
      console.error('❌ Erro ao acessar dashboard:', dashboardResponse.status);
      const errorData = await dashboardResponse.json();
      console.error('Detalhes:', errorData);
      return;
    }

    const dashboardData = await dashboardResponse.json();
    console.log('✅ Dashboard carregado com sucesso!');
    console.log('');
    console.log('📊 Estatísticas:');
    console.log('- Usuários:', dashboardData.users.total);
    console.log('- Produtos:', dashboardData.products.total);
    console.log('- Pedidos:', dashboardData.orders.total);
    console.log('- Categorias:', dashboardData.categories.total);
    console.log('');
    console.log('✅ Todos os testes passaram!');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
    console.error('');
    console.error('Possíveis causas:');
    console.error('1. Backend não está rodando');
    console.error('2. Porta incorreta (verifique se é 5000)');
    console.error('3. Banco de dados não está conectado');
    console.error('');
    console.error('Solução:');
    console.error('Execute: npm run dev');
  }
}

testAdminRoute();
