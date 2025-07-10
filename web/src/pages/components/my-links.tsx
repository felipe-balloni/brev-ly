import React, {useEffect, useState} from 'react';

import {CopyIcon, DownloadSimpleIcon, TrashIcon} from '@phosphor-icons/react';
import {Button} from '../../components/button.tsx';
import {LinkService} from '../../services/link-service';
import {Toast} from '../../components/toast';

type LinkApiResponse = {
    links: Array<{
        id: string;
        originalUrl: string;
        shortenedUrl: string;
        accessCount: number;
        createdAt: string;
    }>;
    nextCursor?: string;
};

export const MyLinks: React.FC = () => {
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadError, setDownloadError] = useState(false);
    const [links, setLinks] = useState<LinkApiResponse['links']>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [successToast, setSuccessToast] = useState('');
    const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    const LIMIT = 10;

    const fetchLinks = async (cursor?: string) => {
        if (cursor) setIsFetchingMore(true);
        else setIsLoading(true);
        setIsError(false);
        try {
            const res = await LinkService.getLinks(LIMIT, cursor);
            const data: LinkApiResponse = res.data;
            setLinks(prev => cursor ? [...prev, ...data.links] : data.links);
            setNextCursor(data.nextCursor);
        } catch {
            setIsError(true);
        } finally {
            if (cursor) setIsFetchingMore(false);
            else setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLinks();
    }, []);

    // Scroll infinito: carrega mais quando chega perto do final
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const {scrollTop, scrollHeight, clientHeight} = e.currentTarget;
        if (scrollHeight - scrollTop - clientHeight < 80 && nextCursor && !isFetchingMore && !isLoading) {
            fetchLinks(nextCursor);
        }
    };

    const handleDelete = async (shortenedUrl: string) => {
        setDeletingId(shortenedUrl);
        try {
            await LinkService.deleteLink(shortenedUrl);
            setLinks(prev => prev.filter(l => l.shortenedUrl !== shortenedUrl));
            setSuccessToast('Link deletado com sucesso!');
        } catch {
            setDownloadError(true);
        } finally {
            setDeletingId(null);
        }
    };

    const handleExportCSV = async () => {
        setIsDownloading(true);
        setDownloadError(false);

        try {
            const {data} = await LinkService.exportCsv();
            const response = await fetch(data.reportUrl, {mode: 'cors'});
            if (!response.ok) throw new Error('Erro ao baixar o arquivo');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const fileName = data.reportUrl.split('/').pop()?.split('?')[0] || '';

            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            setDownloadError(true);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div
            className="relative w-full md:min-w-xl md:max-w-xl h-fit flex flex-col flex-1 gap-5 md:gap-6 bg-gray-100 rounded-lg p-6 md:p-8">
            <div className="flex flex-row items-center justify-between">
                <h2 className="text-lg text-gray-600">Meus links</h2>
                <Button
                    variant="secondary"
                    icon={DownloadSimpleIcon}
                    onClick={handleExportCSV}
                    disabled={isDownloading}
                    data-testid="button-download"
                >
                    Baixar CSV
                </Button>
            </div>
            <div className="border-t border-gray-200 mt-2 pt-2" style={{maxHeight: '60vh', overflowY: 'auto'}}
                onScroll={handleScroll}>
                {isError ? (
                    <div className="flex flex-col items-center text-gray-400 py-8">
                        <span className="text-danger">Erro ao carregar os links cadastrados</span>
                    </div>
                ) : isLoading ? (
                    <div className="flex flex-col items-center py-8">
                        <span className="animate-spin text-blue-base">⏳</span>
                        <span className="text-gray-400 mt-2">Carregando links...</span>
                    </div>
                ) : links.length === 0 ? (
                    <div className="flex flex-col items-center py-8">
                        <span className="text-gray-400">Ainda não existem links cadastrados</span>
                    </div>
                ) : (
                    <div className="flex flex-col divide-y divide-gray-200">
                        {links.map(link => (
                            <div key={link.id}
                                className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-4">
                                <div className="flex w-full items-center justify-between min-w-0">
                                    <div className="flex flex-col">
                                        <div
                                            className="truncate text-blue-base font-semibold text-sm">
                                            <a href={window.location.origin + '/' + link.shortenedUrl} target="_blank"
                                                rel="noreferrer">
                                                {'brev.ly/' + link.shortenedUrl}
                                            </a>
                                        </div>
                                        <div className="truncate text-gray-500 text-sm">{link.originalUrl}</div>
                                    </div>
                                    <div className="text-sm text-gray-500"> {link.accessCount} acessos</div>
                                </div>
                                <div className="flex flex-row gap-1.5 mt-2 md:mt-0">
                                    <Button
                                        variant="secondary"
                                        onClick={() => navigator.clipboard.writeText(window.location.origin + '/' + link.shortenedUrl)}
                                        icon={CopyIcon}
                                    >
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() => handleDelete(link.shortenedUrl)}
                                        disabled={deletingId === link.shortenedUrl}
                                        icon={TrashIcon}
                                    >
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {isFetchingMore && (
                            <div className="flex flex-row justify-center py-2 text-blue-base animate-pulse">Carregando
                                mais...</div>
                        )}
                    </div>
                )}
            </div>
            <Toast
                id="toast-download-error"
                type="error"
                open={downloadError}
                onOpenChange={setDownloadError}
                title="Erro ao realizar a ação"
                description="Por favor, tente novamente mais tarde."
            />
            <Toast
                id="toast-success"
                type="success"
                open={!!successToast}
                onOpenChange={() => setSuccessToast('')}
                title="Sucesso!"
                description={successToast}
            />
        </div>
    );
};