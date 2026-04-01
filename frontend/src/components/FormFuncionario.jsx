import { useEffect, useState } from "react";

const estadoInicial = {
  nome: "",
  cpf: "",
  cargo_id: "",
  departamento_id: "",
  status: "Ativo",
};

function aplicarMascaraCPF(valor) {
  const numeros = String(valor).replace(/\D/g, "").slice(0, 11);

  if (numeros.length <= 3) return numeros;
  if (numeros.length <= 6) return `${numeros.slice(0, 3)}.${numeros.slice(3)}`;
  if (numeros.length <= 9) {
    return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6)}`;
  }

  return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(
    6,
    9
  )}-${numeros.slice(9, 11)}`;
}

export default function FormFuncionario({
  onCancelar,
  onSalvar,
  funcionarioEdicao,
  cargos = [],
  setores = [],
}) {
  const [form, setForm] = useState(estadoInicial);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (funcionarioEdicao) {
      setForm({
        nome: funcionarioEdicao.nome || "",
        cpf: funcionarioEdicao.cpf || "",
        cargo_id: funcionarioEdicao.cargo_id ?? "",
        departamento_id: funcionarioEdicao.departamento_id ?? "",
        status: funcionarioEdicao.status || "Ativo",
      });
    } else {
      setForm(estadoInicial);
    }
  }, [funcionarioEdicao]);

  function handleChange(e) {
    const { name, value } = e.target;

    let novoValor = value;

    if (name === "cpf") {
      novoValor = aplicarMascaraCPF(value);
    }

    setForm((prev) => ({
      ...prev,
      [name]: novoValor,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.nome.trim()) {
      alert("Preencha o nome do funcionário.");
      return;
    }

    if (!form.cpf.trim()) {
      alert("Preencha o CPF.");
      return;
    }

    if (!String(form.cargo_id).trim()) {
      alert("Selecione o cargo.");
      return;
    }

    if (!String(form.departamento_id).trim()) {
      alert("Selecione o setor.");
      return;
    }

    try {
      setSaving(true);
      await onSalvar(form);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h2 style={styles.title}>
          {funcionarioEdicao ? "Editar Funcionário" : "Novo Funcionário"}
        </h2>
        <p style={styles.subtitle}>
          {funcionarioEdicao
            ? "Altere os dados abaixo para atualizar o cadastro."
            : "Preencha os dados abaixo para cadastrar."}
        </p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.grid}>
          <div style={styles.fieldFull}>
            <label style={styles.label}>Nome</label>
            <input
              type="text"
              name="nome"
              value={form.nome}
              onChange={handleChange}
              style={styles.input}
              placeholder="Digite o nome completo"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>CPF</label>
            <input
              type="text"
              name="cpf"
              value={form.cpf}
              onChange={handleChange}
              style={styles.input}
              placeholder="000.000.000-00"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              style={styles.input}
            >
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Cargo</label>
            <select
              name="cargo_id"
              value={form.cargo_id}
              onChange={handleChange}
              style={styles.input}
            >
              <option value="">Selecione um cargo</option>
              {cargos.map((cargo, index) => (
                <option
                  key={cargo.id ?? cargo.value ?? index}
                  value={cargo.id ?? ""}
                >
                  {cargo.nome}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Setor</label>
            <select
              name="departamento_id"
              value={form.departamento_id}
              onChange={handleChange}
              style={styles.input}
            >
              <option value="">Selecione um setor</option>
              {setores.map((setor, index) => (
                <option
                  key={setor.id ?? setor.value ?? index}
                  value={setor.id ?? ""}
                >
                  {setor.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={styles.actions}>
          <button type="button" onClick={onCancelar} style={styles.cancelButton}>
            Voltar
          </button>

          <button type="submit" disabled={saving} style={styles.saveButton}>
            {saving
              ? "Salvando..."
              : funcionarioEdicao
              ? "Salvar Alterações"
              : "Salvar Funcionário"}
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    padding: "24px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
  },
  header: {
    marginBottom: "24px",
  },
  title: {
    fontSize: "22px",
    marginBottom: "6px",
    color: "#111827",
  },
  subtitle: {
    fontSize: "14px",
    color: "#6b7280",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "18px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  fieldFull: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    gridColumn: "1 / -1",
  },
  label: {
    fontSize: "14px",
    fontWeight: "bold",
    color: "#374151",
  },
  input: {
    padding: "12px 14px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    outline: "none",
    backgroundColor: "#fff",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    flexWrap: "wrap",
  },
  cancelButton: {
    padding: "12px 18px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    backgroundColor: "#ffffff",
    color: "#374151",
    fontWeight: "bold",
    cursor: "pointer",
  },
  saveButton: {
    padding: "12px 18px",
    border: "none",
    borderRadius: "10px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontWeight: "bold",
    cursor: "pointer",
  },
};