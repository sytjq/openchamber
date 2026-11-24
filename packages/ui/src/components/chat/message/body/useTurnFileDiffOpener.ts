import React from 'react';
import { useMobileAppActions } from '@/apps/mobileAppContext';
import { useChatSessionSelection } from '../../chatColumnSession';
import { useSessionUIStore } from '@/sync/session-ui-store';
import { useUIStore } from '@/stores/useUIStore';
import { useRuntimeAPIs } from '@/hooks/useRuntimeAPIs';
import { opencodeClient } from '@/lib/opencode/client';
import { openTurnFileDiffInEditor } from '../openTurnFileDiffInEditor';
import { toast } from '@/components/ui';
import { useI18n } from '@/lib/i18n';
import { useEffectiveDirectory } from '@/hooks/useEffectiveDirectory';
import { FULL_CONTEXT_DIFF_LINES } from '@/components/views/diffView/diffContextLines';

export function useTurnFileDiffOpener(turnId?: string) {
    const { t } = useI18n();
    const effectiveDirectory = useEffectiveDirectory();
    const { sessionId } = useChatSessionSelection();
    const isMobile = useUIStore((state) => state.isMobile);
    const navigateToDiff = useUIStore((state) => state.navigateToDiff);
    const openContextDiff = useUIStore((state) => state.openContextDiff);
    const setPendingTurnDiffFile = useUIStore((state) => state.setPendingTurnDiffFile);
    const mobileActions = useMobileAppActions();
    const runtime = useRuntimeAPIs();

    return React.useCallback((file: string) => {
        const editor = runtime.editor;
        if (runtime.runtime.isVSCode && editor && effectiveDirectory) {
            if (!sessionId) return;
            void opencodeClient.getSessionTurnDiff(sessionId, { directory: effectiveDirectory, from: turnId, context: FULL_CONTEXT_DIFF_LINES })
                .then((turnDiff) => openTurnFileDiffInEditor({ directory: effectiveDirectory, editor, file, turnDiff }))
                .catch(() => toast.error(t('diffView.state.failedToLoadDiff')));
            return;
        }

        if (mobileActions) {
            mobileActions.openChanges({ diffPath: file, scope: 'turn', turnId, sessionId, directory: effectiveDirectory });
            return;
        }

        setPendingTurnDiffFile({ file, sessionId, turnId, panelSessionId: useSessionUIStore.getState().currentSessionId });
        if (!isMobile && effectiveDirectory) {
            openContextDiff(effectiveDirectory, file, false, 'turn');
            return;
        }

        navigateToDiff(file, false, 'turn');
    }, [effectiveDirectory, isMobile, mobileActions, navigateToDiff, openContextDiff, runtime, sessionId, setPendingTurnDiffFile, t, turnId]);
}
