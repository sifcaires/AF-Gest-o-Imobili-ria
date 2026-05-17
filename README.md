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

## ⚠️ Solução de Erros Comuns

### auth/configuration-not-found
Este erro ocorre quando o provedor Google não está ativado no Firebase.
1. Vá para o [Console do Firebase](https://console.firebase.google.com/).
2. Selecione seu projeto (ex: `gen-lang-client-0661787852`).
3. Vá em **Authentication** > **Sign-in method**.
4. Clique em **Adicionar novo provedor** e selecione **Google**.
5. Ative e salve as configurações.

### Domínio não autorizado
Se o login funcionar no ambiente de desenvolvimento mas falhar na Vercel:
1. No Console do Firebase, vá em **Authentication** > **Settings** > **Authorized domains**.
2. Adicione o domínio da sua aplicação Vercel (ex: `seu-app.vercel.app`).
