import {createBrowserRouter} from 'react-router';

import {Home} from '../pages/home.tsx';
// import { Redirect } from '@/pages/app/redirect'
import {NotFound} from '../pages/not-found.tsx';


export const router = createBrowserRouter([
    {path: '/', Component: Home},
    // {
    //     path: '/:shortUrl',
    //     element: <Redirect />,
    // },
    {
        path: '*', Component: NotFound
    },
]);