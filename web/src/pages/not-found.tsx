import notFoundImage from '../assets/404.svg';

export const NotFound = () => {
    return (

        <main className="flex min-h-screen w-screen flex-row items-center justify-center bg-gray-200 p-4">
            <div
                className="flex h-fit w-full flex-col items-center gap-6 rounded-lg bg-gray-100 px-12 py-5 text-center md:max-w-xl md:px-12 md:py-16">
                <img
                    src={notFoundImage}
                    alt="404 como uma imagem que ilustra o erro não encontrado"
                    className="w-36 md:w-48"
                />

                <h1 className="text-xl text-gray-600">Link não encontrado</h1>

                <p className="text-gray-500 text-md">
                    O link que você está tentando acessar não existe, foi removido ou é
                    uma URL inválida. Saiba mais em{' '}
                    <a
                        href="/"
                        className="underline text-blue-base"
                        data-testid="link-brev-ly"
                    >
                        brev.ly
                    </a>
                    .
                </p>
            </div>
        </main>
    );
};
