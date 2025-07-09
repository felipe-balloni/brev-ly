import {WarningIcon} from '@phosphor-icons/react';
import React, {type ComponentProps} from 'react';
import { tv } from 'tailwind-variants';

const labelVariants = tv({
    base: 'text-xs text-gray-500 uppercase focus:font-bold transition-all duration-150',
    variants: {
        intent: {
            default: 'group-focus-within:text-blue-base group-focus-within:font-bold',
            error: 'text-danger font-bold',
        },
    },
    defaultVariants: {
        intent: 'default',
    },

});

const inputContainerVariants = tv({
    base: 'peer flex flex-row items-center text-gray-600 text-md font-normal border border-gray-300 rounded-lg transition-all duration-150',
    variants: {
        intent: {
            default: 'group-focus-within:border-blue-base group-focus-within:border-[1.5px]',
            error: 'border-danger border-[1.5px]',
        },
    },
    defaultVariants: {
        intent: 'default',
    },
});

const inputVariants = tv({
    base: 'text-md text-gray-600 font-normal w-full rounded-lg caret-blue-base py-2.5 px-2.5 placeholder:text-gray-400 outline-none focus:text-blue-base transition-all duration-150',
});

export type InputProps = Omit<ComponentProps<'input'>, 'prefix'> & {
  id: string;
  label: string;
  error?: string;
  prefix?: string;
};

export const Input: React.FC<InputProps> = ({
    id,
    label,
    error,
    prefix,
    ...props
}) => {
    const intent = error && error.trim() ? 'error' : 'default';

    return (
        <div className="group relative w-full flex flex-col gap-2">
            <label
                htmlFor={id}
                className={labelVariants({ intent })}
            >
                {label}
            </label>

            <div className={inputContainerVariants({ intent })}>
                {prefix && (
                    <span className="pl-2.5 text-gray-500 text-md font-normal select-none -mr-1.5">
                        {prefix}
                    </span>
                )}
                <input
                    id={id}
                    className={inputVariants()}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${id}-error` : undefined}
                    {...props}
                />
            </div>

            {error && (
                <div className="flex flex-row items-center gap-2 mt-1">
                    <WarningIcon className="text-danger" size={16} />
                    <span id={`${id}-error`} className="text-xs text-danger font-bold">{error}</span>
                </div>
            )}
        </div>
    );
};
