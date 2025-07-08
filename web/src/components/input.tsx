import { WarningIcon } from '@phosphor-icons/react';
import React, {type ComponentProps } from 'react';
import { tv } from 'tailwind-variants';

const labelVariants = tv({
    base: 'text-xs text-gray-500 uppercase focus:font-bold peer-focus:font-bold',
    variants: {
        intent: {
            default: 'peer-focus:text-blue-base',
            error: 'text-danger font-bold',
        },
    },
    defaultVariants: {
        intent: 'default',
    },
});

const inputVariants = tv({
    base: 'peer text-gray-600 text-md font-normal border border-gray-300 caret-blue-base rounded-lg py-2.5 px-2.5 placeholder:text-gray-400 focus:outline-none focus:border-1.5px transition-all duration-150',
    variants: {
        intent: {
            default: 'focus:border-blue-base',
            error: 'border-danger',
        },
    },
    defaultVariants: {
        intent: 'default',
    },
});

type InputProps = ComponentProps<'input'> & {
    id: string;
    label: string;
    error?: string;
};

export const Input: React.FC<InputProps> = ({
    id,
    label,
    error,
    ...props
}) => {
    const intent = error ? 'error' : 'default';

    return (
        <div className="max-w-176 w-full flex flex-col gap-2">
            <label htmlFor={id} className={labelVariants({ intent })}>
                {label}
            </label>

            <input
                id={id}
                type="text"
                aria-invalid={!!error}
                aria-describedby={`${id}-error`}
                className={inputVariants({ intent })}
                {...props}
            />

            {error && (
                <div className="flex flex-row items-center gap-2">
                    <WarningIcon color="var(--color-danger)" />

                    <span
                        id={`${id}-error`}
                        className="text-sm text-gray-500"
                        data-testid={`${id}-error`}
                    >
                        {error}
                    </span>
                </div>
            )}




        </div>
    );
};