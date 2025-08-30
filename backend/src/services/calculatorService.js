const { runQuery } = require('../config/database');
const logger = require('../middleware/logger');

/**
 * Serviço para cálculos de preços, descontos e métricas
 */
class CalculatorService {
  
  /**
   * Calcular valor líquido do item (preço - desconto)
   */
  calcularValorLiquido(valorUnitario, quantidade, desconto = 0) {
    const valorTotal = valorUnitario * quantidade;
    const valorLiquido = valorTotal - desconto;
    
    return {
      valorUnitario: parseFloat(valorUnitario),
      quantidade: parseFloat(quantidade),
      valorTotal: parseFloat(valorTotal.toFixed(2)),
      desconto: parseFloat(desconto),
      valorLiquido: parseFloat(valorLiquido.toFixed(2)),
      precoUnitarioLiquido: parseFloat((valorLiquido / quantidade).toFixed(2))
    };
  }
  
  /**
   * Calcular estatísticas de preços de um produto
   */
  async calcularEstatisticasPreco(produtoId, periodoMeses = 12) {
    try {
      const query = `
        SELECT 
          i.valor_unitario,
          i.quantidade,
          i.desconto,
          i.valor_liquido,
          (i.valor_liquido / i.quantidade) as preco_unitario_liquido,
          n.data_emissao,
          f.nome as fornecedor
        FROM itens_nota i
        JOIN notas n ON i.nota_id = n.id
        JOIN fornecedores f ON n.fornecedor_id = f.id
        WHERE i.produto_id = $1
          AND n.data_emissao >= CURRENT_DATE - INTERVAL '${periodoMeses} months'
        ORDER BY n.data_emissao DESC
      `;
      
      const historico = await runQuery(query, [produtoId]);
      
      if (historico.length === 0) {
        return {
          totalCompras: 0,
          menorPreco: 0,
          maiorPreco: 0,
          precoMedio: 0,
          desconteMedio: 0,
          quantidadeTotal: 0,
          fornecedores: []
        };
      }
      
      const precos = historico.map(h => parseFloat(h.preco_unitario_liquido));
      const descontos = historico.map(h => parseFloat(h.desconto || 0));
      const quantidades = historico.map(h => parseFloat(h.quantidade));
      
      // Cálculos estatísticos
      const menorPreco = Math.min(...precos);
      const maiorPreco = Math.max(...precos);
      const precoMedio = precos.reduce((acc, p) => acc + p, 0) / precos.length;
      const desconteMedio = descontos.reduce((acc, d) => acc + d, 0) / descontos.length;
      const quantidadeTotal = quantidades.reduce((acc, q) => acc + q, 0);
      
      // Agrupar por fornecedor
      const fornecedoresMap = {};
      historico.forEach(h => {
        const nome = h.fornecedor;
        if (!fornecedoresMap[nome]) {
          fornecedoresMap[nome] = {
            nome,
            compras: 0,
            quantidadeTotal: 0,
            menorPreco: parseFloat(h.preco_unitario_liquido),
            maiorPreco: parseFloat(h.preco_unitario_liquido),
            precoMedio: 0,
            precos: []
          };
        }
        
        const fornecedor = fornecedoresMap[nome];
        const preco = parseFloat(h.preco_unitario_liquido);
        
        fornecedor.compras++;
        fornecedor.quantidadeTotal += parseFloat(h.quantidade);
        fornecedor.menorPreco = Math.min(fornecedor.menorPreco, preco);
        fornecedor.maiorPreco = Math.max(fornecedor.maiorPreco, preco);
        fornecedor.precos.push(preco);
      });
      
      // Calcular preço médio por fornecedor
      const fornecedores = Object.values(fornecedoresMap).map(f => ({
        ...f,
        precoMedio: f.precos.reduce((acc, p) => acc + p, 0) / f.precos.length,
        precos: undefined // Remover array temporário
      }));
      
      return {
        totalCompras: historico.length,
        menorPreco: parseFloat(menorPreco.toFixed(2)),
        maiorPreco: parseFloat(maiorPreco.toFixed(2)),
        precoMedio: parseFloat(precoMedio.toFixed(2)),
        desconteMedio: parseFloat(desconteMedio.toFixed(2)),
        quantidadeTotal: parseFloat(quantidadeTotal.toFixed(2)),
        fornecedores: fornecedores.sort((a, b) => a.menorPreco - b.menorPreco)
      };
      
    } catch (error) {
      logger.error('Erro ao calcular estatísticas de preço:', error);
      throw error;
    }
  }
  
  /**
   * Calcular economia/perda comparando fornecedores
   */
  async calcularComparacaoFornecedores(produtoId, quantidade, periodoMeses = 6) {
    try {
      const estatisticas = await this.calcularEstatisticasPreco(produtoId, periodoMeses);
      
      if (estatisticas.fornecedores.length < 2) {
        return {
          analiseDisponivel: false,
          motivo: 'Poucos fornecedores para comparação'
        };
      }
      
      const fornecedores = estatisticas.fornecedores;
      const melhorFornecedor = fornecedores[0]; // Já ordenado por menor preço
      const piorFornecedor = fornecedores[fornecedores.length - 1];
      
      const economiaMaxima = (piorFornecedor.precoMedio - melhorFornecedor.precoMedio) * quantidade;
      const percentualEconomia = ((piorFornecedor.precoMedio - melhorFornecedor.precoMedio) / piorFornecedor.precoMedio) * 100;
      
      return {
        analiseDisponivel: true,
        melhorFornecedor: {
          nome: melhorFornecedor.nome,
          precoMedio: melhorFornecedor.precoMedio,
          valorTotal: (melhorFornecedor.precoMedio * quantidade).toFixed(2)
        },
        piorFornecedor: {
          nome: piorFornecedor.nome,
          precoMedio: piorFornecedor.precoMedio,
          valorTotal: (piorFornecedor.precoMedio * quantidade).toFixed(2)
        },
        economiaMaxima: parseFloat(economiaMaxima.toFixed(2)),
        percentualEconomia: parseFloat(percentualEconomia.toFixed(2)),
        quantidade,
        totalFornecedores: fornecedores.length
      };
      
    } catch (error) {
      logger.error('Erro ao calcular comparação de fornecedores:', error);
      throw error;
    }
  }
  
  /**
   * Calcular margem de lucro baseada em preço de custo e venda
   */
  calcularMargem(precoCusto, precoVenda) {
    if (precoCusto <= 0 || precoVenda <= 0) {
      return {
        margemBruta: 0,
        margemPercentual: 0,
        markup: 0
      };
    }
    
    const margemBruta = precoVenda - precoCusto;
    const margemPercentual = (margemBruta / precoVenda) * 100;
    const markup = (margemBruta / precoCusto) * 100;
    
    return {
      precoCusto: parseFloat(precoCusto),
      precoVenda: parseFloat(precoVenda),
      margemBruta: parseFloat(margemBruta.toFixed(2)),
      margemPercentual: parseFloat(margemPercentual.toFixed(2)),
      markup: parseFloat(markup.toFixed(2))
    };
  }
  
  /**
   * Calcular preço sugerido baseado em margem desejada
   */
  calcularPrecoSugerido(precoCusto, margemPercentualDesejada) {
    if (precoCusto <= 0 || margemPercentualDesejada < 0) {
      return 0;
    }
    
    // Fórmula: Preço de Venda = Preço de Custo / (1 - Margem Percentual / 100)
    const precoSugerido = precoCusto / (1 - margemPercentualDesejada / 100);
    
    return parseFloat(precoSugerido.toFixed(2));
  }
  
  /**
   * Calcular variação percentual entre dois valores
   */
  calcularVariacao(valorAnterior, valorAtual) {
    if (valorAnterior === 0) {
      return valorAtual > 0 ? 100 : 0;
    }
    
    const variacao = ((valorAtual - valorAnterior) / Math.abs(valorAnterior)) * 100;
    
    return {
      valorAnterior: parseFloat(valorAnterior),
      valorAtual: parseFloat(valorAtual),
      diferenca: parseFloat((valorAtual - valorAnterior).toFixed(2)),
      variacao: parseFloat(variacao.toFixed(2)),
      tipo: variacao > 0 ? 'aumento' : variacao < 0 ? 'reducao' : 'inalterado'
    };
  }
}

module.exports = new CalculatorService();
