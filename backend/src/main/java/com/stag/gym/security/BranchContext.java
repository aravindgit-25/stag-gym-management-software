package com.stag.gym.security;

public class BranchContext {
    private static final ThreadLocal<Long> currentBranchId = new ThreadLocal<>();

    public static void setCurrentBranchId(Long branchId) {
        currentBranchId.set(branchId);
    }

    public static Long getCurrentBranchId() {
        return currentBranchId.get();
    }

    public static void clear() {
        currentBranchId.remove();
    }
}
