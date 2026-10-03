import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

// Mengarahkan import './supabaseClient' ke stub pengujian.
register('./stub-loader.mjs', pathToFileURL('./test/'));
