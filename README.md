# AlugaFácil - Gestão de Locação Imobiliária

Sistema moderno para gestão de imóveis, inquilinos, contratos e pagamentos.

## Tecnologias
- React + Vite
- Tailwind CSS
- Firebase (Auth & Firestore)
- jsPDF (Geração de Boletos)

## Como implantar na Vercel

1. Crie um novo projeto na Vercel e conecte seu repositório.
2. Configure as seguintes variáveis de ambiente (Environment Variables) no painel da Vercel:

| Variável | Descrição |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | Sua Chave de API do Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Domínio de Autenticação |
| `VITE_FIREBASE_PROJECT_ID` | ID do Projeto Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | Bucket de Armazenamento |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ID do Remetente de Mensagens |
| `VITE_FIREBASE_APP_ID` | ID do Aplicativo |
| `VITE_FIREBASE_DATABASE_ID` | ID do Banco de Dados Firestore (geralmente `(default)`) |

3. O comando de build será `npm run build` e o diretório de saída será `dist`.

## Autenticação
O sistema utiliza o Google Auth. Certifique-se de adicionar o domínio da sua aplicação Vercel na lista de domínios autorizados no Console do Firebase (Autenticação > Configurações > Domínios Autorizados).
