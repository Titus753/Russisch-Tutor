import { render } from 'preact';
import { App } from './App';
import './styles.css';

const wurzel = document.getElementById('app');
if (!wurzel) throw new Error('Element #app fehlt');
render(<App />, wurzel);
