package IMS.Entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

@Entity
@Table(name = "debit_note_item")
public class DebitNoteItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String productName;

    private Integer qty;

    private Double autoPrice;

    private Double amount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "debit_note_id")
    @JsonBackReference
    private AddDebitNote debitNote;

    // Getters & Setters

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public Integer getQty() { return qty; }
    public void setQty(Integer qty) { this.qty = qty; }

    public Double getAutoPrice() { return autoPrice; }
    public void setAutoPrice(Double autoPrice) { this.autoPrice = autoPrice; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public AddDebitNote getDebitNote() { return debitNote; }
    public void setDebitNote(AddDebitNote debitNote) { this.debitNote = debitNote; }
}
