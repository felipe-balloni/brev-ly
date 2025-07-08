import {Button} from './components/button';
import {CopyIcon} from '@phosphor-icons/react';
import {Input} from './components/input';

export function App() {

    return (
        <>
            <h1 className="text-3xl font-bold underline">
          Hello world!
            </h1>

            <h2 className="text-xs font-semibold">
          Welcome to your React app with Tailwind CSS!
            </h2>

            <Button variant="primary">Test primary</Button>
            <Button variant="secondary">Test secondary</Button>
            <Button variant="secondary" icon={CopyIcon}>Icon</Button>
            <Button variant="secondary" icon={CopyIcon}></Button>

            <Input id="test" label="Test" placeholder="asdsada asda dssa" error="true"/>
        </>
    );
}
