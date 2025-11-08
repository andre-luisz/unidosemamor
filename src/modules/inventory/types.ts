export type Categoria = "Grãos" | "Higiene" | "Enlatados" | "Limpeza" | "Bebidas" | "Outros";


export type Item = {
id: string;
nome: string;
categoria: Categoria;
unidade: string; // ex: "kg", "unid", "L"
quantidade: number; // estoque disponível
prioridade?: "Baixa" | "Média" | "Alta"; // opcional para campanhas
};


export const CATEGORIAS: Categoria[] = ["Grãos", "Higiene", "Enlatados", "Limpeza", "Bebidas", "Outros"];


export const ITENS_INICIAIS: Item[] = [
{ id: "1", nome: "Arroz", categoria: "Grãos", unidade: "kg", quantidade: 22, prioridade: "Alta" },
{ id: "2", nome: "Feijão", categoria: "Grãos", unidade: "kg", quantidade: 18, prioridade: "Alta" },
{ id: "3", nome: "Macarrão", categoria: "Grãos", unidade: "kg", quantidade: 30, prioridade: "Média" },
{ id: "4", nome: "Óleo", categoria: "Outros", unidade: "L", quantidade: 9 },
{ id: "5", nome: "Leite", categoria: "Bebidas", unidade: "L", quantidade: 14 },
{ id: "6", nome: "Sabonete", categoria: "Higiene", unidade: "unid", quantidade: 40 },
{ id: "7", nome: "Detergente", categoria: "Limpeza", unidade: "unid", quantidade: 25 },
{ id: "8", nome: "Milho em lata", categoria: "Enlatados", unidade: "unid", quantidade: 12 },
];