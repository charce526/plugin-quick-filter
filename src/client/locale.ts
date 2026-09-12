import { useTranslation } from 'react-i18next';
import { NAMESPACE } from '../shared/locale';

export { NAMESPACE };

export function useQuickFilterTranslation() {
  return useTranslation([NAMESPACE, 'client'], { nsMode: 'fallback' });
}
