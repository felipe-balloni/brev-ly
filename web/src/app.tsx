import {Button} from './components/button';
import {CopyIcon} from '@phosphor-icons/react';
import {Input} from './components/input';

export function App() {

    return (
        <div className="p-4 flex flex-col gap-4 items-start">
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

            {/* Input with text prefix */}
            <Input
                id="website-prefix"
                label="Website"
                prefix="http://"
                placeholder="your-site.com"
            />

            {/* Input with another text prefix */}
            <Input
                id="domain-prefix"
                label="Domain"
                prefix="www."
                placeholder="your-domain.com"
            />

            {/*Input with error */}
            <Input
                id="error-example"
                label="With Error"
                prefix="https://"
                placeholder="example.com"
                error="Invalid URL format."
            />

            {/*/!* Standard Input without prefix *!/*/}
            <Input
                id="name"
                label="Name"
                placeholder="Enter your name"
            />
        </div>
    );
}
