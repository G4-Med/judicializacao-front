/**
 * O CONTEÚDO do Processo Operacional — separado do componente de propósito.
 *
 * POR QUE ESTE ARQUIVO EXISTE SOZINHO:
 *   O processo muda (prazo, dono de etapa, regra nova). Quem vai atualizar isso é
 *   quem conhece a operação, não quem mexe em React. Deixar o texto num arquivo de
 *   dados puro faz a atualização ser edição de texto, não alteração de tela.
 *
 * DE ONDE VEM CADA FALA:
 *   Transcrição integral da reunião @R × equipe do Instituto Mateus, 2026-08-24
 *   10:49-12:41 BRT (1089 linhas). As citações são VERBATIM — não foram reescritas
 *   nem "melhoradas". O valor delas está em serem a voz de quem explicou, e é isso
 *   que faz a regra parar de soar arbitrária.
 */

export interface Etapa {
  id: string;
  numero: number;
  titulo: string;
  dono: 'INSTITUTO' | 'G4MED';
  rota?: string;
  oQueFaz: string;
  comoFazer: string[];
  prazo?: string;
  falaDoRapha?: string;
  atencao?: string;
}

export const DONOS = {
  INSTITUTO: { rotulo: 'Instituto Mateus', cor: '#0F766E' },
  G4MED: { rotulo: 'G4MED', cor: '#7C3AED' },
} as const;

export const ETAPAS: Etapa[] = [
  {
    id: 'juridico',
    numero: 1,
    titulo: 'Jurídico — a triagem',
    dono: 'INSTITUTO',
    rota: '/juridico',
    prazo: 'Todo dia de manhã · liberado até 11h/meio-dia',
    oQueFaz:
      'Aqui chegam os pedidos que a Secretaria de Estado mandou por e-mail. O sistema cadastra sozinho. ' +
      'A análise decide se aquele pedido merece virar cotação.',
    comoFazer: [
      'Abra o pedido no lápis e leia o e-mail que a Secretaria enviou.',
      'Confira a peça processual pelo anexo e pegue o número do processo (CNJ).',
      'Marque COTAR, NÃO COTAR ou SEGREDO DE JUSTIÇA.',
      'Se já houver orçamentos concorrentes nos autos, registre o nome do local completo e o valor — isso vira inteligência de preço.',
      'Se marcar NÃO COTAR, escreva o motivo. Sem motivo, não salva.',
    ],
    falaDoRapha:
      'A gente teve vários pedidos que a pessoa do jurídico escreveu não cotar e que era para cotar. ' +
      'Então cria realmente os critérios para não cotar.',
    atencao:
      'Assim que você salva, o pedido some da sua lista e vai para a G4MED. Na maioria das vezes as ' +
      'crianças serão segredo de justiça — marcar isso muda o tratamento do pedido daqui pra frente.',
  },
  {
    id: 'selecionar-medico',
    numero: 2,
    titulo: 'Selecionar médico',
    dono: 'G4MED',
    rota: '/selecionar-medico',
    prazo: '24 horas para o médico dizer SE vai cotar',
    oQueFaz:
      'A G4MED escolhe para qual médico o pedido vai. Esta etapa não aparece para o Instituto — ' +
      'mas é aqui que a rede de vocês entra.',
    comoFazer: [
      'O pedido vai primeiro para os médicos da G4MED.',
      'Se em 24h ninguém sinalizar, o @R pergunta no grupo do Instituto se vocês têm um profissional.',
      'Se vocês tiverem, o médico é cadastrado em Clientes (nome com "- Instituto" no fim, para separar) e o pedido é transferido para ele.',
      'Se nem vocês tiverem, aí sim vira perda — e a Secretaria é avisada.',
    ],
    falaDoRapha:
      'Primeiro eu mando pros nossos 26. Se depois de 24 horas o cara não me responder, eu vou trocar ' +
      'pro médico que vocês me indicarem. Se vocês falarem que não tem, aí eu vou dar perda nele por ' +
      'não termos o profissional, e vou responder à secretaria falando que a gente não tem.',
  },
  {
    id: 'orcamento-medico',
    numero: 3,
    titulo: 'Orçamento médico — a cobrança',
    dono: 'G4MED',
    rota: '/orcamento-medico',
    prazo: '96 horas (4 dias) para o orçamento voltar',
    oQueFaz:
      'Lista tudo que foi pedido ao médico e ainda não voltou. É a fila que mede se estamos ' +
      'cumprindo o prazo com o Estado.',
    comoFazer: [
      'Se o médico avisar que não consegue em 4 dias, pergunte a ele até que dia consegue.',
      'Sinalize esse prazo à G4MED — o @R avisa a Secretaria por e-mail e pergunta se pode aguardar.',
    ],
    falaDoRapha:
      'A gente não pode é mentir no prazo. Se a gente tiver que mudar 96 horas, a gente muda. ' +
      'Porque aí a funcionária pública fala: eu vou aguardar o Rafa me responder até eu fechar o contrato.',
    atencao:
      'Pedido parado aqui é dinheiro perdido. O @R mostrou casos com 59 dias — a essa altura a ' +
      'Secretaria já conseguiu com outro e o nosso orçamento não serve mais.',
  },
  {
    id: 'para-protocolar',
    numero: 4,
    titulo: 'Para protocolar — juntar aos autos',
    dono: 'INSTITUTO',
    rota: '/para-protocolar',
    oQueFaz:
      'O orçamento voltou. Agora ele entra no processo judicial como terceiro interessado. ' +
      'Esta é a área que você ZERA todo dia.',
    comoFazer: [
      'Baixe o orçamento — vem um PDF único, com honorário, OPME e hospital juntos, mesmo que o médico tenha mandado arquivos separados.',
      'LEIA o orçamento procurando erro. Se achar algo grave, devolva à G4MED antes de protocolar.',
      'Confira se o médico tem procuração assinada.',
      'Estruture a peça, protocole no PJe ou eproc.',
      'Volte aqui, informe a data, anexe a petição e confirme no ícone de avião.',
    ],
    falaDoRapha:
      'Vamos supor que você achou algum erro muito grave no orçamento. Você deveria voltar para mim ' +
      'e falar: Rafa, não dá para mandar o orçamento assim. Então tem que ter um trabalho do jurídico ' +
      'para revisar essa parte.',
    atencao:
      'NÃO juntamos laudo médico. O Estado pede só a cotação do valor — o laudo já está no processo. ' +
      'E é UM orçamento por pedido, de um médico só, nunca três.',
  },
  {
    id: 'protocolados',
    numero: 5,
    titulo: 'Protocolados — acompanhar até a decisão',
    dono: 'INSTITUTO',
    rota: '/protocolados',
    oQueFaz:
      'Tudo que já foi protocolado fica aqui até sair a decisão. É onde o processo jurídico termina.',
    comoFazer: [
      'Registre o andamento com uma anotação: "acompanhei hoje, segue aguardando decisão".',
      'Saiu GANHO: marque o valor. O sistema computa a comissão.',
      'Saiu PERDA: registre quais orçamentos concorreram, por quanto, e quem ganhou.',
      'Depois de marcar ganho ou perda, o pedido sai da sua lista.',
    ],
    falaDoRapha:
      'Isso vai me dar uma inteligência para eu entender o que que tá levando cada médico a perder ' +
      'e a gente poder ajustar com cada médico.',
    atencao:
      'A análise da perda não é burocracia: é o que ensina o sistema quais procedimentos e quais ' +
      'médicos convertem.',
  },
  {
    id: 'segredo-justica',
    numero: 6,
    titulo: 'Segredo de justiça',
    dono: 'INSTITUTO',
    rota: '/segredo-justica',
    oQueFaz:
      'Processos com acesso restrito — na maioria das vezes, crianças. Só chegam aqui os que já ' +
      'tiveram orçamento enviado.',
    comoFazer: [
      'Como não temos acesso aos autos, é preciso pedir à Secretaria o contato do advogado ou das partes.',
      'Com o contato, dá para obter as informações que o médico precisa para cotar.',
    ],
    falaDoRapha:
      'Eu pediria pra Secretaria do Estado mandar o e-mail da advogada para que a gente possa entrar ' +
      'em contato e obter maiores informações para ajudar o paciente.',
  },
  {
    id: 'enviado-ses',
    numero: 7,
    titulo: 'Enviado à SES — aguardando retorno técnico',
    dono: 'G4MED',
    rota: '/enviado-ses',
    oQueFaz:
      'O orçamento já foi ao Estado, mas NÃO acompanhamos nos autos: os sem-protocolo (o prazo de ' +
      'protocolar passou) e os segredos de justiça. Aqui só se aguarda o retorno técnico da SES.',
    comoFazer: [
      'Nada a fazer proativamente — a fase é de espera declarada.',
      'Chegou o retorno técnico: clique Registrar e marque GANHO (com o valor) ou PERDA (com o motivo).',
      'Perda sem motivo escrito não salva — é esse texto que ensina o sistema.',
    ],
    falaDoRapha:
      'Não temos que acompanhar e só podemos aguardar um retorno técnico para sabermos se ganhos.',
    atencao:
      'Não confundir com Protocolados (fase 5): lá nós estamos DENTRO do processo e acompanhamos; ' +
      'aqui o orçamento foi entregue e a bola está com o Estado.',
  },
];

export interface Regra {
  titulo: string;
  texto: string;
  fala?: string;
}

export const PRAZOS: { prazo: string; oQue: string; deQuem: string }[] = [
  { prazo: '24 horas', oQue: 'o médico responde SE vai cotar', deQuem: 'médico' },
  { prazo: '96 horas', oQue: 'o orçamento completo é entregue', deQuem: 'médico (4 dias)' },
  { prazo: '1 dia', oQue: 'avisar que NÃO temos profissional', deQuem: 'G4MED' },
  { prazo: '5 a 10 dias', oQue: 'o prazo que o Estado tem no processo — é dele que os nossos derivam', deQuem: 'Estado' },
];

export const REGRAS: Regra[] = [
  {
    titulo: 'Um orçamento só, de um médico só',
    texto: 'Nunca três. A Secretaria pede um orçamento nosso — ela busca os outros dois em outros lugares.',
  },
  {
    titulo: 'Não fazemos laudo médico',
    texto:
      'O Estado pede a cotação do valor, não um parecer clínico. O laudo já está no processo. ' +
      'Fazer laudo é trabalho não remunerado e cria expectativa errada.',
    fala:
      'Nós não somos solicitados pro estado para fazer um relatório médico. O que a gente é ' +
      'solicitado é da cotação do valor do orçamento.',
  },
  {
    titulo: 'O orçamento vem discriminado, num arquivo só',
    texto:
      'Honorário médico, OPME e hospital separados por item, tudo num PDF. O formato padrão é ' +
      'definido pela Valéria. Validade de 60 dias, preço à vista, tabela particular.',
    fala: 'O médico tem que jogar na regra que a gente quer, não na regra que é melhor para ele.',
  },
  {
    titulo: 'Responder rápido vale mais que responder bem',
    texto:
      'Dizer "não temos médico" em um dia preserva o cliente. Ficar em silêncio tentando resolver é ' +
      'o que faz a Secretaria parar de mandar pedidos.',
    fala:
      'Eu não tenho profissional, já respondo com um dia, acabou. Ela sabe que não pode contar comigo ' +
      'naquele pedido. Agora, se eu falo que eu vou cotar, eu tenho que falar para ela até quando eu vou mandar.',
  },
  {
    titulo: 'Volume alto é sinal bom — a resposta é contratar',
    texto:
      'Se chegar mais pedido do que a equipe dá conta, avise a Valéria para contratar. Baixar a régua ' +
      'do prazo é o caminho errado.',
    fala:
      'Se chegar a 30 pedidos num dia, a gente tem que contratar uma outra pessoa. Se chegou 30 pedidos, ' +
      'nós estamos fazendo o trabalho certo. Se não chegar, é porque tem alguma coisa muito errada.',
  },
  {
    titulo: 'Como reportar um problema no sistema',
    texto:
      'Mande a URL da página + um print com o F12 aberto (a telinha de erro do navegador). ' +
      'E diga o nome da tela: "estou na home e está com pau".',
  },
];

/** A tese que sustenta todos os prazos acima. É o PORQUÊ — vem antes do COMO. */
export const PORQUE = {
  titulo: 'Por que o prazo é tão importante',
  paragrafos: [
    'Nosso cliente é um só: a Secretaria de Estado de Saúde de Minas Gerais. Ela foi condenada ' +
      'judicialmente e precisa levar três orçamentos ao juiz, dentro de um prazo de 5 a 10 dias.',
    'Ela tem cerca de 110 hospitais para consultar. Se a G4MED sempre responde em dois dias, um dos ' +
      'três orçamentos que ela leva ao juiz é o nosso — e o problema dela fica resolvido pela metade.',
    'Se a gente não responde, ela marca "G4MED não respondeu". Depois de algumas vezes, ela conclui ' +
      'que não vale a pena mandar. E aí paramos de receber pedidos.',
  ],
  fechamento:
    'Você continuaria comprando papel de alguém que nunca te responde o pedido?',
  proposito:
    'Quando chega um orçamento de uma criança de 8, 9 meses, eu de verdade não estou preocupado com ' +
    'nada financeiro. Eu quero ajudar aquela pessoa. Eu quero que nessa nossa fase a empresa tenha ' +
    'propósito — e realmente não pode ser mentira.',
};

export const FONTE =
  'Reunião de treinamento com a equipe do Instituto Mateus · 24/08/2026 · as falas são transcrição literal.';
