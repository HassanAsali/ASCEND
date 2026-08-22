(function attachAscendStateScope(globalObject) {
  'use strict';

  function normalizeUserId(value) {
    return String(value || '').trim();
  }

  function accountStorageKey(baseStateKey, userId) {
    const normalized = normalizeUserId(userId);
    if (!normalized) throw new Error('A user ID is required for account-scoped state.');
    return `${baseStateKey}.user.${normalized}`;
  }

  function resolveStorageScope({ baseStateKey, guestStateKey, guestActive = false, sessionUserId = '' }) {
    const normalizedUserId = normalizeUserId(sessionUserId);
    if (normalizedUserId) {
      return {
        kind: 'account',
        userId: normalizedUserId,
        storageKey: accountStorageKey(baseStateKey, normalizedUserId)
      };
    }
    if (guestActive) return { kind:'guest', userId:'', storageKey:guestStateKey };
    return { kind:'device', userId:'', storageKey:baseStateKey };
  }

  function chooseUnlockedAccountState({ cachedState = null, remoteState = null, recoveryUnlock = false, timestamp = value => Number(value?.updatedAt || 0) } = {}) {
    if (recoveryUnlock && remoteState) return remoteState;
    if (!cachedState) return remoteState;
    if (!remoteState) return cachedState;
    return timestamp(remoteState) > timestamp(cachedState) ? remoteState : cachedState;
  }

  globalObject.AscendStateScope = Object.freeze({ normalizeUserId, accountStorageKey, resolveStorageScope, chooseUnlockedAccountState });
})(typeof globalThis !== 'undefined' ? globalThis : window);
