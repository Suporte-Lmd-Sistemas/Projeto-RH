import { useNavigate } from "react-router-dom";
import "../styles/funcionarios.css";

function FuncionarioCard({ funcionario }) {
  const navigate = useNavigate();

  function abrirAnalise(event) {
    event.stopPropagation();

    if (!funcionario?.rh_id) {
      console.error("rh_id do funcionário não encontrado:", funcionario);
      return;
    }

    navigate(`/funcionarios/${funcionario.rh_id}/analise`);
  }

  return (
    <div className="funcionario-card">
      <div className="funcionario-avatar"></div>

      <div className="funcionario-id">
        ID ERP - {funcionario.col_pessoa || "Não informado"}
      </div>

      <h3 className="funcionario-nome">{funcionario.nome || "Sem nome"}</h3>

      <div className="funcionario-info-box">
        <div className="funcionario-info-row">
          <span className="funcionario-label">Cargo</span>
          <span className="funcionario-value">
            {funcionario.cargo_rh_nome || funcionario.cargo_oficial || "Não informado"}
          </span>
        </div>

        <div className="funcionario-info-row">
          <span className="funcionario-label">Departamento</span>
          <span className="funcionario-value">
            {funcionario.departamento_nome || "Não informado"}
          </span>
        </div>
      </div>

      <div className="funcionario-tags">
        <span className="tag tag-gray">
          {funcionario.status || "Sem status"}
        </span>

        <button className="tag-button tag-button-blue" onClick={abrirAnalise}>
          Análise
        </button>
      </div>
    </div>
  );
}

export default FuncionarioCard;