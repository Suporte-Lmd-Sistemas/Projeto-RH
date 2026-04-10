import Topbar from "../components/Topbar";
import "../styles/relatorios.css";
import "../styles/topbar.css";

function RelatoriosVendas() {
  const relatorios = [
    { id: 1, nome: "Vendas por período", periodo: "Últimos 7 Dias", data: "Hoje" },
    { id: 2, nome: "Produtos mais vendidos", periodo: "Agosto", data: "Hoje" },
    { id: 3, nome: "Faturamento por empresa", periodo: "Mês Passado", data: "Hoje" },
    { id: 4, nome: "Vendas por vendedor", periodo: "Setembro", data: "Ontem" },
    { id: 5, nome: "Ticket médio", periodo: "Últimos 30 Dias", data: "Ontem" },
    { id: 6, nome: "Meta x realizado", periodo: "Últimos 7 Dias", data: "22/04" },
    { id: 7, nome: "Curva ABC de produtos", periodo: "Últimos 7 Dias", data: "14/02" },
    { id: 8, nome: "Margem por produto", periodo: "Últimos 7 Dias", data: "10/02" },
    { id: 9, nome: "Vendas canceladas", periodo: "Últimos 7 Dias", data: "22/04" },
    { id: 10, nome: "Comparativo mensal", periodo: "Últimos 7 Dias", data: "14/02" },
    { id: 11, nome: "Clientes com maior compra", periodo: "Últimos 7 Dias", data: "10/02" },
    { id: 12, nome: "Vendas por categoria", periodo: "Últimos 7 Dias", data: "22/04" },
  ];

  return (
    <div className="relatorio-list-page">
      <Topbar titulo="Relatórios" caminho="Dashboard / Vendas" />

      <div className="relatorio-filter-bar">
        <div className="empresa-chip-box">
          <span>Empresa:</span>
          <button type="button" className="empresa-chip">
            0 - Todas as Empresas
          </button>
        </div>
      </div>

      <div className="relatorio-list-box">
        <div className="relatorio-list-header">
          <h2>Relatórios Vendas</h2>
        </div>

        <div className="relatorio-list-table-responsive">
          <table className="relatorio-list-table">
            <thead>
              <tr>
                <th>Relatório</th>
                <th>Período</th>
                <th>Data</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {relatorios.map((item) => (
                <tr key={item.id}>
                  <td>{item.nome}</td>
                  <td>{item.periodo}</td>
                  <td>{item.data}</td>
                  <td>
                    <div className="acoes-relatorio">
                      <button type="button" className="acao-icon-btn" title="Visualizar">
                        👁
                      </button>
                      <button type="button" className="acao-icon-btn" title="Exportar">
                        ⬇
                      </button>
                      <button type="button" className="acao-pdf-btn">
                        PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default RelatoriosVendas;