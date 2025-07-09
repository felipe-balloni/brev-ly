import logo from '../assets/logo.svg';
import {NewLink} from './components/new-link';
import {MyLinks} from './components/my-links.tsx';

export const Home = () => {
    return (
        <main
            className="w-full min-h-screen flex flex-col items-center py-4"
        >
            <div
                className="flex w-full px-3 md:px-0 md:w-fit flex-col items-center mt-8 md:mt-20 md:items-start">
                <img
                    src={logo}
                    alt="Ícone de corrente azul representando um link ao lado do nome 'brev.ly' também em azul."
                    className="h-6 mb-6 md:mb-8"
                />

                <div
                    className="flex w-full flex-col items-center justify-center gap-3 md:flex-row md:items-start md:justify-start md:gap-5">
                    <NewLink/>
                    <MyLinks/>
                </div>
            </div>
        </main>
    );
};