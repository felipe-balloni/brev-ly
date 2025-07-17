import {createBrowserRouter} from 'react-router';

import {Home} from '../pages/home.tsx';
import {Redirect} from '../pages/redirect.tsx';
import {NotFound} from '../pages/not-found.tsx';


export const router = createBrowserRouter([
    {path: '/', Component: Home},
    {path: '/:shortUrl', Component: Redirect},
    {path: '*', Component: NotFound},
]);