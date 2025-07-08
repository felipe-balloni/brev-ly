import React, {type ComponentProps, type ComponentType } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';
import type {IconProps} from '@phosphor-icons/react';

const buttonVariants = tv({
    base: 'flex flex-row gap-1 items-center justify-center cursor-pointer transition-all duration-300 disabled:pointer-events-none aria-disabled:pointer-events-none',
    variants: {
        variant: {
            primary:
                'max-w-88 w-full bg-blue-base text-md text-white rounded-lg px-10 py-3.75 hover:not-disabled:bg-blue-dark disabled:opacity-50 aria-disabled:opacity-50',
            secondary:
                'bg-gray-200 border border-gray-200 text-sm font-semibold text-gray-500 rounded-sm p-2.5 hover:not-disabled:border-blue-base disabled:opacity-50',
        },
    },
    defaultVariants: {
        variant: 'primary',
    },
});

type ButtonProps = ComponentProps<'button'> &
    VariantProps<typeof buttonVariants> & {
    icon?: ComponentType<IconProps>;
};

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    icon: Icon,
    children,
    ...props
}) => {
    return (
        <button type="button" className={buttonVariants({ variant })} {...props}>
            {Icon && (
                <Icon color="var(--color-gray-600)"/>
            )}

            {children}
        </button>
    );
};