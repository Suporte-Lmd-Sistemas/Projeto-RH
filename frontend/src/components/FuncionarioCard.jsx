import { useNavigate } from "react-router-dom";

function FuncionarioCard({ funcionario }) {
  const navigate = useNavigate();

  const nome = funcionario?.nome || "Funcionário sem nome";
  const rhId = funcionario?.rh_id;
  const idErp = funcionario?.col_pessoa || "-";
  const cargoRh = funcionario?.cargo_rh_nome || "Não vinculado";
  const cargoOficial = funcionario?.cargo_oficial || "Não informado";
  const departamento = funcionario?.departamento_nome || "Não informado";
  const status = funcionario?.status || "Sem status";
  const vendedor = Boolean(funcionario?.vendedor);

  function abrirAnalise() {
    if (!rhId) {
      alert("Este colaborador ainda não possui vínculo RH para análise.");
      return;
    }

    navigate(`/funcionarios/${rhId}/analise`);
  }

  function abrirDetalhe() {
    if (!rhId) {
      alert("Este colaborador ainda não possui vínculo RH para detalhamento.");
      return;
    }

    navigate(`/funcionarios/${rhId}`);
  }

  return (
    <div className="funcionario-card">
      <div className="funcionario-avatar" />

      <div className="funcionario-id">ERP #{idErp}</div>

      <div className="funcionario-nome">{nome}</div>

      <div className="funcionario-info-box">
        <div className="funcionario-info-row">
          <span className="funcionario-label">Cargo RH</span>
          <span className="funcionario-value">{cargoRh}</span>
        </div>

        <div className="funcionario-info-row">
          <span className="funcionario-label">Cargo ERP</span>
          <span className="funcionario-value">{cargoOficial}</span>
        </div>

        <div className="funcionario-info-row">
          <span className="funcionario-label">Departamento</span>
          <span className="funcionario-value">{departamento}</span>
        </div>

        <div className="funcionario-info-row">
          <span className="funcionario-label">Status</span>
          <span className="funcionario-value">{status}</span>
        </div>
      </div>

      <div className="funcionario-tags">
        {vendedor ? (
          <span className="tag tag-blue">Vendedor</span>
        ) : (
          <span className="tag tag-gray">Colaborador</span>
        )}

        <button
          type="button"
          className="tag-button tag-button-gray"
          onClick={abrirDetalhe}
        >
          Detalhe
        </button>

        <button
          type="button"
          className="tag-button tag-button-blue"
          onClick={abrirAnalise}
        >
          Análise
        </button>
      </div>
    </div>
  );
}

export default FuncionarioCard;