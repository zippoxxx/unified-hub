import * as React from "react";

interface PreviewRespostaProps {
  nome: string;
  mensagem: string;
  onCancelar: () => void;
}

const PreviewResposta: React.FC<PreviewRespostaProps> = ({ nome, mensagem, onCancelar }) => {
  return (
    <div className="bg-gray-100 rounded-md shadow-md p-2 mb-2 relative z-10 transition-all duration-300">
      <div className="h-0.5 bg-primary w-full absolute left-0 top-0"></div>
      <div className="flex flex-col">
        <span className="text-primary-foreground font-bold text-sm">{nome}</span>
        <span className="text-muted-foreground text-sm truncate w-full">{mensagem}</span>
      </div>
      <button className="absolute right-2 top-2 text-primary-foreground hover:opacity-90 transition-all duration-200" onClick={onCancelar}>×</button>
    </div>
  );
};

export { PreviewResposta };