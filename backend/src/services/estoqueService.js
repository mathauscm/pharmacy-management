const { runQuery } = require('../config/database');
const logger = require('../middleware/logger');

/**
 * Serviço para cálculos de estoque e sugestões de compra
 */
class EstoqueService {
  
  /**
   * Calcular estoque mínimo sugerido e quantidade para compra
   */
  async calcularEstoqueSugerido(produtoId, diasAnalise = 90) {
    try {
      // Buscar histórico de compras do produto
      const historicoQuery = `
        SELECT 
          i.quantidade,
          n.data_emissao,
          DATE_PART('day', CURRENT_DATE - n.data_emissao) as dias_atras
        FROM itens_nota i
        JOIN notas n ON i.nota_id = n.id
        WHERE i.produto_id = $1
          AND n.data_emissao >= CURRENT_DATE - INTERVAL '${diasAnalise} days'
        ORDER BY n.data_emissao DESC
      `;
      
      const historico = await runQuery(historicoQuery, [produtoId]);
      
      if (historico.length === 0) {
        return {
          estoqueAtual: 0,
          estoqueMinimo: 10, // Padrão
          quantidadeSugerida: 50, // Padrão
          consumoMedioMensal: 0,
          baseCalculo: 'padrao'
        };
      }
      
      // Calcular consumo médio mensal
      const quantidadeTotal = historico.reduce((acc, item) => acc + parseFloat(item.quantidade), 0);
      const diasComDados = Math.max(1, Math.min(diasAnalise, 
        historico.length > 0 ? historico[historico.length - 1].dias_atras : diasAnalise));
      
      const consumoMedioDiario = quantidadeTotal / diasComDados;
      const consumoMedioMensal = consumoMedioDiario * 30;
      
      // Estoque mínimo: cobertura para 15 dias
      const estoqueMinimo = Math.ceil(consumoMedioDiario * 15);
      
      // Quantidade sugerida: cobertura para 30 dias
      const quantidadeSugerida = Math.ceil(consumoMedioMensal);
      
      // Buscar estoque atual (simulado - em sistema real viria de movimentações)
      const estoqueAtual = await this.obterEstoqueAtual(produtoId);
      
      return {
        estoqueAtual,
        estoqueMinimo,
        quantidadeSugerida: Math.max(0, quantidadeSugerida - estoqueAtual),
        consumoMedioMensal: Math.round(consumoMedioMensal * 100) / 100,
        baseCalculo: 'historico',
        diasAnalise,
        totalComprasAnalisadas: historico.length
      };
      
    } catch (error) {
      logger.error('Erro ao calcular estoque sugerido:', error);
      
      // Retornar valores padrão em caso de erro
      return {
        estoqueAtual: 0,
        estoqueMinimo: 10,
        quantidadeSugerida: 50,
        consumoMedioMensal: 0,
        baseCalculo: 'erro'
      };
    }
  }
  
  /**
   * Obter estoque atual do produto
   * (Simulado - em sistema real consultaria tabela de movimentações)
   */
  async obterEstoqueAtual(produtoId) {
    try {
      const query = `
        SELECT 
          COALESCE(estoque_atual, 0) as estoque
        FROM produtos
        WHERE id = $1
      `;
      
      const resultado = await runQuery(query, [produtoId]);
      
      return resultado.length > 0 ? parseFloat(resultado[0].estoque) : 0;
      
    } catch (error) {
      logger.error('Erro ao obter estoque atual:', error);
      return 0;
    }
  }
  
  /**
   * Atualizar estoque atual do produto
   */
  async atualizarEstoque(produtoId, quantidade, tipo = 'ajuste') {
    try {
      const estoqueAtual = await this.obterEstoqueAtual(produtoId);
      let novoEstoque;
      
      switch (tipo) {
        case 'entrada':
          novoEstoque = estoqueAtual + quantidade;
          break;
        case 'saida':
          novoEstoque = Math.max(0, estoqueAtual - quantidade);
          break;
        case 'ajuste':
        default:
          novoEstoque = quantidade;
          break;
      }
      
      // Atualizar na tabela produtos
      const updateQuery = `
        UPDATE produtos 
        SET estoque_atual = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `;
      
      await runQuery(updateQuery, [novoEstoque, produtoId]);
      
      // Registrar movimentação
      const movQuery = `
        INSERT INTO movimentacao_estoque (
          produto_id, tipo, quantidade, estoque_anterior, 
          estoque_atual, observacao, data_movimentacao
        )
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      `;
      
      await runQuery(movQuery, [
        produtoId,
        tipo,
        quantidade,
        estoqueAtual,
        novoEstoque,
        `Movimentação de ${tipo}`
      ]);
      
      logger.info(`Estoque atualizado - Produto ${produtoId}: ${estoqueAtual} -> ${novoEstoque}`);
      
      return {
        sucesso: true,
        estoqueAnterior: estoqueAtual,
        estoqueAtual: novoEstoque,
        quantidade,
        tipo
      };
      
    } catch (error) {
      logger.error('Erro ao atualizar estoque:', error);
      throw error;
    }
  }
  
  /**
   * Listar produtos com estoque baixo
   */
  async obterProdutosEstoqueBaixo(limite = 20) {
    try {
      const query = `
        SELECT 
          p.id,
          p.nome,
          p.codigo,
          p.fabricante,
          p.unidade,
          p.estoque_atual,
          p.estoque_minimo,
          CASE 
            WHEN p.estoque_atual = 0 THEN 'SEM_ESTOQUE'
            WHEN p.estoque_atual <= p.estoque_minimo THEN 'ESTOQUE_BAIXO'
            ELSE 'OK'
          END as status,
          (p.estoque_minimo - p.estoque_atual) as quantidade_necessaria
        FROM produtos p
        WHERE p.ativo = TRUE 
          AND (p.estoque_atual <= p.estoque_minimo OR p.estoque_atual = 0)
        ORDER BY 
          CASE WHEN p.estoque_atual = 0 THEN 0 ELSE 1 END,
          (p.estoque_minimo - p.estoque_atual) DESC
        LIMIT $1
      `;
      
      const produtos = await runQuery(query, [limite]);
      
      return produtos.map(p => ({
        ...p,
        estoque_atual: parseFloat(p.estoque_atual),
        estoque_minimo: parseFloat(p.estoque_minimo),
        quantidade_necessaria: Math.max(0, parseFloat(p.quantidade_necessaria))
      }));
      
    } catch (error) {
      logger.error('Erro ao listar produtos com estoque baixo:', error);
      return [];
    }
  }
}

module.exports = new EstoqueService();
