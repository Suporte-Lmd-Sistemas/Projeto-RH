import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Topbar from "../components/Topbar";
import api from "../services/api";
import "../styles/dashboard.css";
import "../styles/topbar.css";
import "../styles/funcionario-analise.css";

function FuncionarioAnalise() {
  const params = useParams();
  const id = params.id;

  const [funcionario, setFuncionario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState("");

  const [cargoSelecionado, setCargoSelecionado] = useState("");
  const [departamentoSelecionado, setDepartamentoSelecionado] = useState("");
  const [tipoSelecionado, setTipoSelecionado] = useState("Produto");
  const [ordemSelecionada, setOrdemSelecionada] = useState("Horário");

  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");

  const [cargos, setCargos] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);

  const [auditoria, setAuditoria] = useState([]);
  const [loadingAuditoria, setLoadingAuditoria] = useState(false);
  const [erroAuditoria, setErroAuditoria] = useState("");

  const tiposAuditoria = [
    "Recebimentos",
    "Pagamentos",
    "Nota Fiscal",
    "Venda",
    "Produto",
    "Ordem Serviço",
  ];

  useEffect(() => {
    async function carregarDadosIniciais() {
      if (!id) {
        setErro("ID do funcionário não foi encontrado na rota.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErro("");
        setMensagemSucesso("");

        const [funcionarioResponse, cargosResponse, departamentosResponse] =
          await Promise.all([
            api.get(`/funcionarios/${id}`),
            api.get("/cargos/"),
            api.get("/departamentos/"),
          ]);

        const dadosFuncionario = funcionarioResponse.data;
        const dadosCargos = Array.isArray(cargosResponse.data)
          ? cargosResponse.data
          : [];
        const dadosDepartamentos = Array.isArray(departamentosResponse.data)
          ? departamentosResponse.data
          : [];

        setFuncionario(dadosFuncionario);
        setCargos(dadosCargos);
        setDepartamentos(dadosDepartamentos);

        setCargoSelecionado(dadosFuncionario.cargo_rh_id ?? "");
        setDepartamentoSelecionado(dadosFuncionario.departamento_id ?? "");
      } catch (error) {
        console.error("Erro ao carregar análise do funcionário:", error);
        setErro("Não foi possível carregar os dados do funcionário.");
      } finally {
        setLoading(false);
      }
    }

    carregarDadosIniciais();
  }, [id]);

  useEffect(() => {
    async function carregarAuditoria() {
      if (!id) {
        return;
      }

      try {
        setLoadingAuditoria(true);
        setErroAuditoria("");

        const queryParams = {};

        if (tipoSelecionado && tipoSelecionado.trim() !== "") {
          queryParams.tipo = tipoSelecionado;
        }

        if (dataInicial) {
          queryParams.data_inicial = dataInicial;
        }

        if (dataFinal) {
          queryParams.data_final = dataFinal;
        }

        const response = await api.get(`/funcionarios/${id}/auditoria`, {
          params: queryParams,
        });

        const registros = Array.isArray(response.data?.registros)
          ? response.data.registros
          : [];

        setAuditoria(registros);
      } catch (error) {
        console.error("Erro ao carregar auditoria:", error);
        setErroAuditoria("Não foi possível carregar a auditoria do funcionário.");
        setAuditoria([]);
      } finally {
        setLoadingAuditoria(false);
      }
    }

    carregarAuditoria();
  }, [id, tipoSelecionado, dataInicial, dataFinal]);

  async function salvarAlteracoes() {
    if (!funcionario?.rh_id) {
      setErro("Funcionário inválido para salvar alterações.");
      return;
    }

    try {
      setSalvando(true);
      setErro("");
      setMensagemSucesso("");

      const payload = {
        cargo_id: cargoSelecionado === "" ? null : Number(cargoSelecionado),
        departamento_id:
          departamentoSelecionado === "" ? null : Number(departamentoSelecionado),
      };

      const response = await api.put(`/funcionarios/${funcionario.rh_id}`, payload);

      const funcionarioAtualizado = response.data?.funcionario;

      if (funcionarioAtualizado) {
        setFuncionario((prev) => ({
          ...prev,
          cargo_rh_id: funcionarioAtualizado.cargo_id,
          cargo_rh_nome: funcionarioAtualizado.cargo_nome,
          departamento_id: funcionarioAtualizado.departamento_id,
          departamento_nome: funcionarioAtualizado.departamento_nome,
        }));
      }

      setMensagemSucesso("Alterações salvas com sucesso.");
    } catch (error) {
      console.error("Erro ao salvar alterações:", error);
      setErro("Não foi possível salvar as alterações do funcionário.");
    } finally {
      setSalvando(false);
    }
  }

  function limparFiltrosData() {
    setDataInicial("");
    setDataFinal("");
  }

  function formatarDataHora(valor) {
    if (!valor) {
      return "-";
    }

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
      return String(valor);
    }

    return data.toLocaleString("pt-BR");
  }

  function obterChaveDia(valor) {
    if (!valor) {
      return null;
    }

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
      return null;
    }

    return data.toISOString().slice(0, 10);
  }

  function obterHora(valor) {
    if (!valor) {
      return null;
    }

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
      return null;
    }

    return data.getHours();
  }

  function formatarDiaCurto(chaveDia) {
    if (!chaveDia) {
      return "-";
    }

    const data = new Date(`${chaveDia}T00:00:00`);

    if (Number.isNaN(data.getTime())) {
      return chaveDia;
    }

    return data.toLocaleDateString("pt-BR");
  }

  const auditoriaOrdenada = useMemo(() => {
    const resultado = [...auditoria];

    if (ordemSelecionada === "Horário") {
      resultado.sort((a, b) => {
        const dataA = a.data_hora ? new Date(a.data_hora).getTime() : 0;
        const dataB = b.data_hora ? new Date(b.data_hora).getTime() : 0;
        return dataB - dataA;
      });
    }

    if (ordemSelecionada === "Ação") {
      resultado.sort((a, b) =>
        String(a.acao || "").localeCompare(String(b.acao || ""), "pt-BR")
      );
    }

    if (ordemSelecionada === "Status") {
      resultado.sort((a, b) =>
        String(a.tabela_desc || "").localeCompare(
          String(b.tabela_desc || ""),
          "pt-BR"
        )
      );
    }

    return resultado;
  }, [auditoria, ordemSelecionada]);

  const resumoAuditoria = useMemo(() => {
    const total = auditoria.length;
    const inclusoes = auditoria.filter((item) => item.acao === "Inclusão").length;
    const alteracoes = auditoria.filter((item) => item.acao === "Alteração").length;
    const exclusoes = auditoria.filter((item) => item.acao === "Exclusão").length;
    const cancelamentos = auditoria.filter(
      (item) => item.acao === "Cancelamento"
    ).length;

    return {
      total,
      inclusoes,
      alteracoes,
      exclusoes,
      cancelamentos,
    };
  }, [auditoria]);

  const produtividadeResumo = useMemo(() => {
    const diasSet = new Set();
    const horasMap = {};
    const tabelasMap = {};

    for (const item of auditoria) {
      const chaveDia = obterChaveDia(item.data_hora);
      if (chaveDia) {
        diasSet.add(chaveDia);
      }

      const hora = obterHora(item.data_hora);
      if (hora !== null) {
        const chaveHora = String(hora).padStart(2, "0") + ":00";
        horasMap[chaveHora] = (horasMap[chaveHora] || 0) + 1;
      }

      const tabela = item.tabela_desc || "Não informado";
      tabelasMap[tabela] = (tabelasMap[tabela] || 0) + 1;
    }

    const diasComAtividade = diasSet.size;
    const mediaPorDia =
      diasComAtividade > 0
        ? (auditoria.length / diasComAtividade).toFixed(1)
        : "0.0";

    const horaMaisAtiva = Object.entries(horasMap).sort((a, b) => b[1] - a[1])[0];
    const tabelaMaisMovimentada = Object.entries(tabelasMap).sort(
      (a, b) => b[1] - a[1]
    )[0];

    return {
      diasComAtividade,
      mediaPorDia,
      horaMaisAtiva: horaMaisAtiva ? horaMaisAtiva[0] : "-",
      totalHoraMaisAtiva: horaMaisAtiva ? horaMaisAtiva[1] : 0,
      tabelaMaisMovimentada: tabelaMaisMovimentada
        ? tabelaMaisMovimentada[0]
        : "-",
      totalTabelaMaisMovimentada: tabelaMaisMovimentada
        ? tabelaMaisMovimentada[1]
        : 0,
    };
  }, [auditoria]);

  const graficoPorDia = useMemo(() => {
    const mapa = {};

    for (const item of auditoria) {
      const chaveDia = obterChaveDia(item.data_hora);
      if (!chaveDia) {
        continue;
      }
      mapa[chaveDia] = (mapa[chaveDia] || 0) + 1;
    }

    const itens = Object.entries(mapa)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([dia, total]) => ({
        label: formatarDiaCurto(dia),
        total,
      }));

    const max = Math.max(...itens.map((item) => item.total), 1);

    return itens.map((item) => ({
      ...item,
      porcentagem: (item.total / max) * 100,
    }));
  }, [auditoria]);

  const graficoPorHora = useMemo(() => {
    const mapa = {};

    for (const item of auditoria) {
      const hora = obterHora(item.data_hora);
      if (hora === null) {
        continue;
      }

      const label = String(hora).padStart(2, "0") + ":00";
      mapa[label] = (mapa[label] || 0) + 1;
    }

    const itens = Object.entries(mapa)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([hora, total]) => ({
        label: hora,
        total,
      }));

    const max = Math.max(...itens.map((item) => item.total), 1);

    return itens.map((item) => ({
      ...item,
      porcentagem: (item.total / max) * 100,
    }));
  }, [auditoria]);

  if (loading) {
    return (
      <div className="dashboard-page">
        <Topbar titulo="Análise de Produtividade" caminho="Dashboard / Auditoria" />
        <div className="analise-box">Carregando funcionário...</div>
      </div>
    );
  }

  if (erro && !funcionario) {
    return (
      <div className="dashboard-page">
        <Topbar titulo="Análise de Produtividade" caminho="Dashboard / Auditoria" />
        <div className="analise-box analise-erro">{erro}</div>
      </div>
    );
  }

  if (!funcionario) {
    return (
      <div className="dashboard-page">
        <Topbar titulo="Análise de Produtividade" caminho="Dashboard / Auditoria" />
        <div className="analise-box">Funcionário não encontrado.</div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <Topbar titulo="Análise de Produtividade" caminho="Dashboard / Auditoria" />

      <div className="analise-resumo-grid">
        <div className="analise-box">
          <h3 className="analise-titulo-box">Resumo do Funcionário</h3>

          <div className="analise-resumo-linhas">
            <div>
              <strong>Nome:</strong>{" "}
              {funcionario.erp_pessoa?.PES_RSOCIAL_NOME || "Não informado"}
            </div>
            <div>
              <strong>ID ERP:</strong> {funcionario.col_pessoa || "Não informado"}
            </div>
            <div>
              <strong>CPF:</strong>{" "}
              {funcionario.erp_pessoa?.PES_CNPJ_CPF || "Não informado"}
            </div>
            <div>
              <strong>Data de admissão:</strong>{" "}
              {funcionario.data_admissao_oficial || "Não informado"}
            </div>
            <div>
              <strong>Cargo oficial ERP:</strong>{" "}
              {funcionario.cargo_oficial || "Não informado"}
            </div>
            <div>
              <strong>Status oficial ERP:</strong>{" "}
              {funcionario.status_oficial || "Não informado"}
            </div>
            <div>
              <strong>Cargo RH atual:</strong>{" "}
              {funcionario.cargo_rh_nome || "Não informado"}
            </div>
            <div>
              <strong>Departamento RH atual:</strong>{" "}
              {funcionario.departamento_nome || "Não informado"}
            </div>
          </div>
        </div>

        <div className="analise-box">
          <h3 className="analise-titulo-box">Alterações RH</h3>

          <div className="analise-form-group">
            <label className="analise-label">Cargo RH</label>
            <select
              className="analise-select"
              value={cargoSelecionado}
              onChange={(e) => setCargoSelecionado(e.target.value)}
            >
              <option value="">Selecione um cargo</option>
              {cargos.map((cargo) => (
                <option key={cargo.id} value={cargo.id}>
                  {cargo.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="analise-form-group">
            <label className="analise-label">Departamento RH</label>
            <select
              className="analise-select"
              value={departamentoSelecionado}
              onChange={(e) => setDepartamentoSelecionado(e.target.value)}
            >
              <option value="">Selecione um departamento</option>
              {departamentos.map((departamento) => (
                <option key={departamento.id} value={departamento.id}>
                  {departamento.nome}
                </option>
              ))}
            </select>
          </div>

          <button
            className="analise-salvar-btn"
            onClick={salvarAlteracoes}
            disabled={salvando}
          >
            {salvando ? "Salvando..." : "Salvar alterações"}
          </button>

          {mensagemSucesso && (
            <div className="analise-feedback analise-sucesso">
              {mensagemSucesso}
            </div>
          )}

          {erro && (
            <div className="analise-feedback analise-erro">{erro}</div>
          )}
        </div>
      </div>

      <div className="analise-toolbar">
        <div className="analise-tipos">
          {tiposAuditoria.map((tipo) => (
            <button
              key={tipo}
              className={`analise-tipo-btn ${
                tipoSelecionado === tipo ? "active" : ""
              }`}
              onClick={() => setTipoSelecionado(tipo)}
            >
              {tipo}
            </button>
          ))}
        </div>

        <div className="analise-ordem-box">
          <span>Ordem:</span>
          <select
            className="analise-select analise-select-small"
            value={ordemSelecionada}
            onChange={(e) => setOrdemSelecionada(e.target.value)}
          >
            <option value="Horário">Horário</option>
            <option value="Ação">Ação</option>
            <option value="Status">Status</option>
          </select>
        </div>
      </div>

      <div className="analise-box analise-box-filtros">
        <div className="analise-filtros-topo">
          <h3 className="analise-titulo-box sem-margem">Filtros de Data</h3>
          <button className="analise-limpar-btn" onClick={limparFiltrosData}>
            Limpar datas
          </button>
        </div>

        <div className="analise-filtros-data-inline">
          <div className="analise-filtro-data-item">
            <label className="analise-label">Data inicial</label>
            <input
              type="date"
              className="analise-select"
              value={dataInicial}
              onChange={(e) => setDataInicial(e.target.value)}
            />
          </div>

          <div className="analise-filtro-data-item">
            <label className="analise-label">Data final</label>
            <input
              type="date"
              className="analise-select"
              value={dataFinal}
              onChange={(e) => setDataFinal(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="auditoria-cards-grid">
        <div className="auditoria-card auditoria-card-total">
          <span className="auditoria-card-label">Total de ações</span>
          <strong className="auditoria-card-value">{resumoAuditoria.total}</strong>
        </div>

        <div className="auditoria-card auditoria-card-inclusao">
          <span className="auditoria-card-label">Inclusões</span>
          <strong className="auditoria-card-value">{resumoAuditoria.inclusoes}</strong>
        </div>

        <div className="auditoria-card auditoria-card-alteracao">
          <span className="auditoria-card-label">Alterações</span>
          <strong className="auditoria-card-value">{resumoAuditoria.alteracoes}</strong>
        </div>

        <div className="auditoria-card auditoria-card-exclusao">
          <span className="auditoria-card-label">Exclusões</span>
          <strong className="auditoria-card-value">{resumoAuditoria.exclusoes}</strong>
        </div>

        <div className="auditoria-card auditoria-card-cancelamento">
          <span className="auditoria-card-label">Cancelamentos</span>
          <strong className="auditoria-card-value">{resumoAuditoria.cancelamentos}</strong>
        </div>
      </div>

      <div className="produtividade-cards-grid">
        <div className="produtividade-card">
          <span className="produtividade-card-label">Dias com atividade</span>
          <strong className="produtividade-card-value">
            {produtividadeResumo.diasComAtividade}
          </strong>
        </div>

        <div className="produtividade-card">
          <span className="produtividade-card-label">Média por dia</span>
          <strong className="produtividade-card-value">
            {produtividadeResumo.mediaPorDia}
          </strong>
        </div>

        <div className="produtividade-card">
          <span className="produtividade-card-label">Hora mais ativa</span>
          <strong className="produtividade-card-value">
            {produtividadeResumo.horaMaisAtiva}
          </strong>
          <small className="produtividade-card-sub">
            {produtividadeResumo.totalHoraMaisAtiva} ação(ões)
          </small>
        </div>

        <div className="produtividade-card produtividade-card-wide">
          <span className="produtividade-card-label">Tabela mais movimentada</span>
          <strong className="produtividade-card-value produtividade-card-text">
            {produtividadeResumo.tabelaMaisMovimentada}
          </strong>
          <small className="produtividade-card-sub">
            {produtividadeResumo.totalTabelaMaisMovimentada} ação(ões)
          </small>
        </div>
      </div>

      <div className="graficos-produtividade-grid">
        <div className="analise-box">
          <div className="analise-tabela-topo">
            <h3 className="analise-titulo-box sem-margem">Ações por Dia</h3>
          </div>

          {graficoPorDia.length === 0 ? (
            <div className="analise-feedback">Sem dados para o gráfico por dia.</div>
          ) : (
            <div className="grafico-barras-lista">
              {graficoPorDia.map((item) => (
                <div key={item.label} className="grafico-barra-item">
                  <div className="grafico-barra-topo">
                    <span className="grafico-barra-label">{item.label}</span>
                    <span className="grafico-barra-valor">{item.total}</span>
                  </div>

                  <div className="grafico-barra-fundo">
                    <div
                      className="grafico-barra-preenchimento"
                      style={{ width: `${item.porcentagem}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="analise-box">
          <div className="analise-tabela-topo">
            <h3 className="analise-titulo-box sem-margem">Ações por Horário</h3>
          </div>

          {graficoPorHora.length === 0 ? (
            <div className="analise-feedback">Sem dados para o gráfico por horário.</div>
          ) : (
            <div className="grafico-barras-lista">
              {graficoPorHora.map((item) => (
                <div key={item.label} className="grafico-barra-item">
                  <div className="grafico-barra-topo">
                    <span className="grafico-barra-label">{item.label}</span>
                    <span className="grafico-barra-valor">{item.total}</span>
                  </div>

                  <div className="grafico-barra-fundo">
                    <div
                      className="grafico-barra-preenchimento grafico-barra-preenchimento-secundario"
                      style={{ width: `${item.porcentagem}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="analise-box">
        <div className="analise-tabela-topo">
          <h3 className="analise-titulo-box sem-margem">Análise Funcionário</h3>
          <span className="analise-total-badge">
            {auditoriaOrdenada.length} registro(s)
          </span>
        </div>

        {loadingAuditoria && (
          <div className="analise-feedback">Carregando auditoria...</div>
        )}

        {!loadingAuditoria && erroAuditoria && (
          <div className="analise-feedback analise-erro">{erroAuditoria}</div>
        )}

        {!loadingAuditoria && !erroAuditoria && auditoriaOrdenada.length === 0 && (
          <div className="analise-feedback">
            Nenhum registro de auditoria encontrado para este funcionário.
          </div>
        )}

        {!loadingAuditoria && !erroAuditoria && auditoriaOrdenada.length > 0 && (
          <>
            <div className="analise-table-wrapper">
              <table className="analise-table">
                <thead>
                  <tr>
                    <th className="col-data">Data e Hora</th>
                    <th className="col-acao">Ação</th>
                    <th className="col-tabela">Tabela que mexeu</th>
                    <th className="col-campo">O que foi feito</th>
                    <th className="col-registro">O que alterou</th>
                  </tr>
                </thead>
                <tbody>
                  {auditoriaOrdenada.map((item, index) => (
                    <tr key={`${item.aud_sequencia || index}-${index}`}>
                      <td className="td-data">{formatarDataHora(item.data_hora)}</td>
                      <td>
                        <span
                          className={`acao-pill ${
                            item.acao === "Inclusão"
                              ? "acao-inclusao"
                              : item.acao === "Alteração"
                              ? "acao-alteracao"
                              : item.acao === "Exclusão"
                              ? "acao-exclusao"
                              : item.acao === "Cancelamento"
                              ? "acao-cancelamento"
                              : ""
                          }`}
                        >
                          {item.acao || "-"}
                        </span>
                      </td>
                      <td>{item.tabela_desc || "-"}</td>
                      <td>{item.campo_desc || "-"}</td>
                      <td>{item.descricao_registro || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="analise-footer">
              <div>Mostrando {auditoriaOrdenada.length} resultado(s)</div>

              <div className="analise-paginacao">
                <button className="pagina-btn">‹</button>
                <button className="pagina-btn active">1</button>
                <button className="pagina-btn">›</button>
              </div>
            </div>
          </>
        )}
      </div>
       </div>
  );
}

export default FuncionarioAnalise;