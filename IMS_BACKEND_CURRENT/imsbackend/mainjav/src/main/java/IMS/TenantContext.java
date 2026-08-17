package IMS;

public class TenantContext {
    private static final ThreadLocal<String> current = new ThreadLocal<>();

    public static void setTenant(String tenantId) { current.set(tenantId); }
    public static String getTenant() { return current.get(); }
    public static void clear() { current.remove(); }
}
