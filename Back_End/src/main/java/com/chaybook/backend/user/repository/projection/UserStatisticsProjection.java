package com.chaybook.backend.user.repository.projection;

public interface UserStatisticsProjection {

    long getTotalAccounts();

    long getActiveAccounts();

    long getDisabledAccounts();

    long getNewAccountsThisWeek();
}
