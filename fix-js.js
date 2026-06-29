const fs = require('fs');

let c = fs.readFileSync('ultimate-sd/src/components/widgets/PrivacyRequestManager.tsx', 'utf8');

c = c.replace(
`export default function PrivacyRequestManager() {
    const [stores, setStores] = useState<DataStore[]>(INITIAL_STORES);
    const [requestState, setRequestState] = useState<'idle' | 'scanning' | 'ready' | 'purging' | 'completed'>('idle');
    const [scanProgress, setScanProgress] = useState(0);

    const startScan = () => {`,
`export default function PrivacyRequestManager() {
    const [stores, setStores] = useState<DataStore[]>(INITIAL_STORES);
    const [requestState, setRequestState] = useState<'idle' | 'scanning' | 'ready' | 'purging' | 'completed'>('idle');
    const [scanProgress, setScanProgress] = useState(0);
    const timeoutsRef = React.useRef<NodeJS.Timeout[]>([]);

    React.useEffect(() => {
        return () => {
            timeoutsRef.current.forEach(clearTimeout);
        };
    }, []);

    const startScan = () => {`
);

fs.writeFileSync('ultimate-sd/src/components/widgets/PrivacyRequestManager.tsx', c);

console.log("Fixed PrivacyRequestManager");
