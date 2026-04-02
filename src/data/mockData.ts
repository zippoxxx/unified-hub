export interface ChatItem {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread?: number;
  online?: boolean;
  pinned?: boolean;
}

export interface Message {
  id: string;
  text: string;
  time: string;
  sent: boolean;
  image?: string;
}

export interface Contact {
  id: string;
  name: string;
  extension: string;
  department: string;
  external?: boolean;
  online?: boolean;
}

export interface CallRecord {
  id: string;
  name: string;
  extension: string;
  type: "missed" | "incoming" | "outgoing";
  date: string;
  time: string;
  online?: boolean;
}

export interface Meeting {
  id: string;
  title: string;
  meetingId: string;
  creator: string;
  creatorExt: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "finished" | "scheduled";
  participants: { name: string; extension: string }[];
}

export const chats: ChatItem[] = [
  { id: "1", name: "TI Matsuko Indústria", lastMessage: "André Franceschini: https://glp...", time: "15:15", unread: 9, pinned: true },
  { id: "2", name: "Assistente de n...", lastMessage: "", time: "23/10/2025", pinned: true },
  { id: "3", name: "Manuti 3° edição (ag...)", lastMessage: "André Franceschini: https://glp...", time: "15:15" },
  { id: "4", name: "Vinícius Cato", lastMessage: "Vinícius Cato respondeu 😆", time: "13:22", online: true },
  { id: "5", name: "Pietro Marchioli", lastMessage: "Por nada manuw é nois", time: "Ontem" },
  { id: "6", name: "Nicolas Navas Segato", lastMessage: "claude", time: "Ontem", online: false },
  { id: "7", name: "Nicolas Moretti", lastMessage: "Beleza", time: "Ontem" },
  { id: "8", name: "Josiane Deolindo", lastMessage: "Obrigado! 😄", time: "Ontem", online: true },
  { id: "9", name: "Natan Marques", lastMessage: "[Imagem]", time: "16/3" },
  { id: "10", name: "Vitor Hugo", lastMessage: "obrigado Natan!", time: "13/3", online: true },
];

export const chatMessages: Record<string, Message[]> = {
  "4": [
    { id: "m1", text: "", time: "13/3 11:34", sent: true, image: "claudio" },
    { id: "m2", text: "Condição aplicada com sucesso!", time: "16/3 13:11", sent: true },
    { id: "m3", text: "😆", time: "13:22", sent: false },
  ],
  "1": [
    { id: "m1", text: "Pessoal, segue o link atualizado do sistema", time: "14:50", sent: false },
    { id: "m2", text: "https://glp.matsuko.com.br/login", time: "15:00", sent: false },
    { id: "m3", text: "Obrigado!", time: "15:15", sent: true },
  ],
};

export const contacts: Contact[] = [
  { id: "c1", name: "a-- COMERCIAL --a", extension: "8800", department: "Contatos da empresa", external: true },
  { id: "c2", name: "a-- COMPOSTO --a", extension: "8835", department: "Contatos da empresa", external: true },
  { id: "c3", name: "a-- COMPRAS --a", extension: "8803", department: "Contatos da empresa", external: true },
  { id: "c4", name: "a-- CONFECÇÃO --a", extension: "8834", department: "Contatos da empresa", external: true },
  { id: "c5", name: "a-- EXPEDIÇÃO --a", extension: "8839", department: "Contatos da empresa", external: true },
  { id: "c6", name: "a-- FINANCEIRO --a", extension: "8810", department: "Contatos da empresa", external: true },
  { id: "c7", name: "a-- MANUTENÇÃO --a", extension: "8821", department: "Contatos da empresa", external: true },
  { id: "c8", name: "a-- QUALIDADE --a", extension: "8820", department: "Contatos da empresa", external: true },
  { id: "c9", name: "a-- RH --a", extension: "8818", department: "Contatos da empresa", external: true },
];

export const callHistory: CallRecord[] = [
  { id: "cl1", name: "Vinícius Cato", extension: "8767", type: "missed", date: "24/3", time: "10:32", online: true },
  { id: "cl2", name: "+551150265164", extension: "+551150265164", type: "missed", date: "18/3", time: "16:11" },
  { id: "cl3", name: "Matheus Weider Silva Ferreira", extension: "8715", type: "missed", date: "18/3", time: "16:10", online: true },
  { id: "cl4", name: "Juliana Alves de Souza", extension: "8791", type: "missed", date: "12/3", time: "10:50" },
  { id: "cl5", name: "Fagner Sena", extension: "8725", type: "missed", date: "11/3", time: "16:33" },
  { id: "cl6", name: "Moises Vilarino", extension: "8776", type: "missed", date: "11/3", time: "09:01" },
  { id: "cl7", name: "Moises Vilarino", extension: "8776", type: "missed", date: "4/3", time: "11:54" },
  { id: "cl8", name: "Vinícius Cato", extension: "8767", type: "missed", date: "26/2", time: "15:49", online: true },
  { id: "cl9", name: "Josiane Deolindo", extension: "8700", type: "missed", date: "25/2", time: "12:29", online: true },
];

export const meetings: Meeting[] = [
  {
    id: "mt1", title: "Meeting by Vinícius Cato", meetingId: "40602021",
    creator: "Vinícius Cato", creatorExt: "8767",
    date: "04/02", startTime: "09:08", endTime: "09:12", status: "finished",
    participants: [
      { name: "André Franceschini", extension: "8766" },
      { name: "8771", extension: "8771" },
      { name: "Mim (Natan Marques)", extension: "8730" },
      { name: "Nicolas Navas Segato", extension: "8770" },
    ],
  },
  {
    id: "mt2", title: "Reunião por André Franceschini", meetingId: "90802022",
    creator: "André Franceschini", creatorExt: "87...",
    date: "11/06/2025", startTime: "18:00", endTime: "18:01", status: "finished",
    participants: [
      { name: "André Franceschini", extension: "8766" },
      { name: "Natan Marques", extension: "8730" },
    ],
  },
];
