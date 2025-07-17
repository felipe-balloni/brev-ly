import React, {useEffect, useState} from 'react';
import {useLocation, useNavigate} from 'react-router';
import logoIcon from '../assets/logo-icon.svg';
import {AxiosError} from 'axios';
import {LinkService} from '../services/link-service.ts';


export const Redirect: React.FC = () => {
    const {pathname} = useLocation();
    const navigate = useNavigate();
    const [originalUrl, setOriginalUrl] = useState<string | null>(null);

    useEffect(() => {
        const getOriginalLink = async (): Promise<void> => {
            try {
                const {data} = await LinkService.accessOriginalLink(
                    pathname.slice(1),
                );

                let url = data;

                if (url.startsWith('www.')) {
                    url = `https://${url}`;
                }

                setOriginalUrl(url);
            } catch (error) {
                const err = error as AxiosError;

                if (err.status === 404) {
                    navigate('/url/not-found');
                }
            }
        };
        if (pathname) {
            getOriginalLink();
        }
    }, [pathname, navigate]);

    useEffect(() => {
        if (originalUrl) {
            const timer = setTimeout(() => {
                window.location.href = originalUrl;
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [originalUrl]);

    return (
        <main
            className="w-screen min-h-screen flex flex-row items-center justify-center p-6 bg-gray-200"
            data-testid="container-redirect-page"
        >
            <div
                className="max-w-xl w-full h-fit flex flex-col gap-6 items-center text-center bg-gray-100 rounded-lg px-5 py-12 md:px-16 md:py-12"
            >
                <img
                    src={logoIcon}
                    alt="Logotipo do site com um ícone de corrente azul que representa um link."
                    className="h-12"
                />
                <h1 className="text-xl text-gray-600">Redirecionando...</h1>
                <div className="flex flex-col gap-">
                    <p className="text-md text-gray-500">
                        O link será aberto automaticamente em alguns instantes.
                    </p>
                    <p className="text-md text-gray-500">
                        Não foi redirecionado?{' '}
                        {originalUrl ? (
                            <a
                                href={originalUrl}
                                className="text-blue-base underline break-all"
                                data-testid="link-access-here"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Acesse aqui
                            </a>
                        ) : (
                            <span className="text-gray-400">Carregando link...</span>
                        )}
                    </p>
                </div>
            </div>
        </main>
    );
};