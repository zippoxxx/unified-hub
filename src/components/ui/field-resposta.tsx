import * as React from "react";
import { Input } from './input';
import { PreviewResposta } from './preview-resposta';

interface FieldRespostaProps {
  placeholder: string;
  onChange: (valor: string) => void;
  resposta?: { nome: string; mensagem: string };
  onCancelarResposta: () => void;
}

const FieldResposta: React.FC<FieldRespostaProps> = ({ placeholder, onChange, resposta, onCancelarResposta }) => {
  return (
    <div>
      {resposta && (
        <PreviewResposta nome={resposta.nome} mensagem={resposta.mensagem} onCancelar={onCancelarResposta} />
      )}
      <Input className="w-full" placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
};

export { FieldResposta };