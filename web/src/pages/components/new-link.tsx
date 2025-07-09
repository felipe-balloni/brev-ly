import React, {useState} from 'react';

import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {Input} from '../../components/input.tsx';
import {Button} from '../../components/button.tsx';
import {LinkService} from '../../services/link-service';
import {Toast} from '../../components/toast';
import type {AxiosError} from 'axios';

const newUrlSchema = z
    .object({
        originalUrl: z
            .string()
            .url('Informe uma url válida.'),
        shortenedUrl: z
            .string()
            .min(3, 'Mínimo de 3 letras')
            .max(10, 'Maximo de  10 letras')
            .regex(/^[a-z0-9-]+$/, 'Apenas letras e números'),
    })
    .required();

type NewLinkData = z.infer<typeof newUrlSchema>;


type ErrorData = {
    message?: string;
};

export const NewLink: React.FC = () => {
    const [openToastError, setOpenToastError] = useState(false);
    const [openToastSuccess, setOpenToastSuccess] = useState(false);
    const [toastSuccessMessage, setToastSuccessMessage] = useState('');
    const [errorCreatingNewLink, setErrorCreatingNewLink] = useState({
        title: '',
        description: '',
    });

    const {
        register,
        handleSubmit,
        formState: {errors, isSubmitting},
        reset,
    } = useForm({
        resolver: zodResolver(newUrlSchema),
    });

    const handleSaveLink = async (data: NewLinkData): Promise<void> => {
        try {
            await LinkService.createLink(data);
            reset();
            setToastSuccessMessage('Link criado com sucesso!');
            setOpenToastSuccess(true);

            setErrorCreatingNewLink({title: '', description: ''});
            setOpenToastError(false);
        } catch (error) {
            const err = error as AxiosError<ErrorData>;

            const title = 'Erro no cadastro';
            if (err?.response) {
                const errorResponse = err.response;
                const errorData = errorResponse.data as ErrorData;

                if (errorResponse.status === 400 && errorData?.message === 'Shortened link already exists') {
                    setErrorCreatingNewLink({title, description: 'Esse link encurtado já existe.'});
                    setOpenToastError(true);
                    return;
                }

                if (errorResponse.status === 422) {
                    setErrorCreatingNewLink({title, description: 'Dados inválidos. Verifique os campos.'});
                    setOpenToastError(true);
                    return;
                }

                if (errorData?.message) {
                    setErrorCreatingNewLink({title, description: errorData.message});
                    setOpenToastError(true);
                    return;
                }
            }

            if (err?.message) {
                setErrorCreatingNewLink({title, description: err.message});
                setOpenToastError(true);
                return;
            }

            setErrorCreatingNewLink({title, description: 'Por favor, tente novamente mais tarde.'});
            setOpenToastError(true);
        }
    };

    return (
        <>
            <form
                onSubmit={handleSubmit(handleSaveLink)}
                className="w-full md:max-w-96 flex flex-col flex-1 gap-5 md:gap-6 bg-gray-100 rounded-lg p-6 md:p-8"
            >
                <h2 className="text-lg text-gray-600">Novo link</h2>

                <div className="flex flex-col gap-4">
                    <Input
                        id="input-original-link"
                        type="url"
                        label="Link Original"
                        placeholder="https://www.exemplo.com.br"
                        error={errors.originalUrl?.message}
                        {...register('originalUrl')}
                    />

                    <Input
                        id="input-shortened-link"
                        label="Link Encurtado"
                        error={errors.shortenedUrl?.message}
                        prefix="brev.ly/"
                        maxLength={10}
                        {...register('shortenedUrl')}
                    />
                </div>

                <Button
                    type="submit"
                    disabled={isSubmitting}
                    data-testid="button-save-link"
                >
                    {isSubmitting ? 'Salvando...' : 'Salvar link'}
                </Button>
            </form>

            <Toast
                id="toast-creation-error"
                type="error"
                title={errorCreatingNewLink.title}
                description={errorCreatingNewLink.description}
                open={openToastError}
                onOpenChange={setOpenToastError}
                duration={4000}
            />

            <Toast
                id="toast-creation-success"
                type="success"
                title="Sucesso!"
                description={toastSuccessMessage}
                open={openToastSuccess}
                onOpenChange={setOpenToastSuccess}
                duration={3000}
            />
        </>
    );
};