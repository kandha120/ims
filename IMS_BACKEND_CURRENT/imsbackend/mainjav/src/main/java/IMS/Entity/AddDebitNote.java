package IMS.Entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "debit_note")
public class AddDebitNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String debitNoteNumber;

    private String date;

    private String originalPoNumber;

    private String originalInvoiceDate;

    private String supplierName;

    @Column(length = 1000)
    private String reasonForIssue;

    private Double totalAmount;

    private Double gst;

    private Double totalCredit;

    private String authorisedSignatory;

    @Column(length = 1000)
    private String remarks;

    @OneToMany(mappedBy = "debitNote", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<DebitNoteItem> items = new ArrayList<>();

    // Getters and Setters

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDebitNoteNumber() { return debitNoteNumber; }
    public void setDebitNoteNumber(String debitNoteNumber) { this.debitNoteNumber = debitNoteNumber; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }


    public String getOriginalPoNumber() { return originalPoNumber; }
    public void setOriginalPoNumber(String originalPoNumber) { this.originalPoNumber = originalPoNumber; }

    public String getOriginalInvoiceDate() { return originalInvoiceDate; }
    public void setOriginalInvoiceDate(String originalInvoiceDate) { this.originalInvoiceDate = originalInvoiceDate; }

    public String getSupplierName() { return supplierName; }
    public void setSupplierName(String supplierName) { this.supplierName = supplierName; }

    public String getReasonForIssue() { return reasonForIssue; }
    public void setReasonForIssue(String reasonForIssue) { this.reasonForIssue = reasonForIssue; }

    public Double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }

    public Double getGst() { return gst; }
    public void setGst(Double gst) { this.gst = gst; }

    public Double getTotalCredit() { return totalCredit; }
    public void setTotalCredit(Double totalCredit) { this.totalCredit = totalCredit; }

    public String getAuthorisedSignatory() { return authorisedSignatory; }
    public void setAuthorisedSignatory(String authorisedSignatory) { this.authorisedSignatory = authorisedSignatory; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public List<DebitNoteItem> getItems() { return items; }

    public void setItems(List<DebitNoteItem> items) {
        this.items.clear();
        if (items != null) {
            items.forEach(this::addItem);
        }
    }

    // Helper to maintain both sides of relation
    public void addItem(DebitNoteItem item) {
        item.setDebitNote(this);
        this.items.add(item);
    }

    public void removeItem(DebitNoteItem item) {
        item.setDebitNote(null);
        this.items.remove(item);
    }
}
